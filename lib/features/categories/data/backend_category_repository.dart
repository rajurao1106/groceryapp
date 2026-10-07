import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/features/categories/domain/category_repository.dart';
import 'package:grocery_app/features/home/data/backend_home_repository.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>(
  (ref) => BackendCategoryRepository(ref.watch(homeRepositoryProvider)),
);

class BackendCategoryRepository implements CategoryRepository {
  const BackendCategoryRepository(this._homeRepository);

  final HomeRepository _homeRepository;

  @override
  Future<List<CategoryGroup>> getCategoryGroups() async {
    final page = await _homeRepository.getHomePage();
    return page.categories
        .map(
          (category) => CategoryGroup(
            id: category.id,
            name: category.name,
            icon: _categoryIcon(category.name),
            subcategories: _productsForCategory(page, category.id)
                .map((product) => product.subcategory)
                .where((name) => name.isNotEmpty)
                .toSet()
                .toList(),
          ),
        )
        .toList();
  }

  @override
  Future<CategoryDetailResult> getCategoryDetails({
    required String categoryId,
    String? subcategory,
    String? brand,
    String? price,
    String? discount,
    String? sortBy,
    int page = 1,
  }) async {
    final homePage = await _homeRepository.getHomePage();
    HomeCategory? category;
    for (final candidate in homePage.categories) {
      if (candidate.id == categoryId) {
        category = candidate;
        break;
      }
    }
    final group = CategoryGroup(
      id: category?.id ?? categoryId,
      name: category?.name ?? _displayName(categoryId),
      icon: _categoryIcon(category?.name ?? categoryId),
      subcategories: category == null
          ? const []
          : _productsForCategory(homePage, categoryId)
                .map((product) => product.subcategory)
                .where((name) => name.isNotEmpty)
                .toSet()
                .toList(),
    );

    var filtered = _productsForCategory(homePage, categoryId);
    if (subcategory != null && subcategory.isNotEmpty) {
      filtered = filtered
          .where((product) => product.subcategory == subcategory)
          .toList();
    }
    if (brand != null && brand.isNotEmpty) {
      filtered = filtered.where((product) => product.brand == brand).toList();
    }
    if (price == 'under_100') {
      filtered = filtered.where((product) => product.sellingPrice < 100).toList();
    } else if (price == '100_200') {
      filtered = filtered
          .where(
            (product) =>
                product.sellingPrice >= 100 && product.sellingPrice <= 200,
          )
          .toList();
    }
    if (discount == '10_plus') {
      filtered = filtered
          .where((product) => product.discountPercent >= 10)
          .toList();
    }

    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.sellingPrice.compareTo(b.sellingPrice));
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.sellingPrice.compareTo(a.sellingPrice));
        break;
      case 'discount':
        filtered.sort((a, b) => b.discountPercent.compareTo(a.discountPercent));
        break;
      default:
        filtered.sort((a, b) => a.name.compareTo(b.name));
        break;
    }

    const pageSize = 10;
    final safePage = page < 1 ? 1 : page;
    final start = (safePage - 1) * pageSize;
    return CategoryDetailResult(
      category: group,
      products: filtered.skip(start).take(pageSize).toList(),
      hasMore: start + pageSize < filtered.length,
      page: safePage,
      subcategories: group.subcategories,
    );
  }

  List<HomeProduct> _productsForCategory(
    HomePageData page,
    String categoryId,
  ) {
    return page.sections
        .expand((section) => section.products)
        .where((product) => _slug(product.subcategory) == categoryId)
        .toList();
  }

  static String _slug(String value) => value.toLowerCase().replaceAll(
    RegExp(r'[^a-z0-9]+'),
    '-',
  ).replaceAll(RegExp(r'^-|-$'), '');

  static String _displayName(String slug) =>
      slug.split('-').map((part) => part.isEmpty
          ? part
          : '${part[0].toUpperCase()}${part.substring(1)}').join(' ');

  static IconData _categoryIcon(String name) {
    switch (name.toLowerCase()) {
      case 'fruits':
        return Icons.apple_rounded;
      case 'vegetables':
        return Icons.eco_rounded;
      case 'dairy':
        return Icons.local_drink_rounded;
      case 'bakery':
        return Icons.breakfast_dining_rounded;
      default:
        return Icons.shopping_basket_outlined;
    }
  }
}
