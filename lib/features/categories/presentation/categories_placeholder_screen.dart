import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/categories/data/backend_category_repository.dart';
import 'package:grocery_app/features/categories/domain/category_repository.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/home/presentation/product_card.dart';
import 'package:grocery_app/features/wishlist/presentation/wishlist_controller.dart';

class CategoriesPlaceholderScreen extends ConsumerStatefulWidget {
  const CategoriesPlaceholderScreen({super.key, this.initialCategoryId});

  final String? initialCategoryId;

  @override
  ConsumerState<CategoriesPlaceholderScreen> createState() =>
      _CategoriesPlaceholderScreenState();
}

class _CategoriesPlaceholderScreenState
    extends ConsumerState<CategoriesPlaceholderScreen> {
  late Future<List<CategoryGroup>> _groupsFuture;
  String _selectedCategoryId = 'fruits';
  String _selectedSubcategory = '';
  String _selectedBrand = '';
  String _selectedPrice = '';
  String _selectedDiscount = '';
  String _sortBy = 'price_asc';
  int _page = 1;
  bool _hasMore = false;
  bool _loadingMore = false;
  String? _categoryError;
  List<HomeProduct> _products = const [];
  List<String> _subcategories = const [];

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.initialCategoryId ?? 'fruits';
    _groupsFuture = ref.read(categoryRepositoryProvider).getCategoryGroups();
    _refreshCategory();
  }

  Future<void> _refreshCategory({bool append = false}) async {
    if (!append) {
      setState(() {
        _loadingMore = false;
        _categoryError = null;
      });
    }

    try {
      final repository = ref.read(categoryRepositoryProvider);
      final result = await repository.getCategoryDetails(
        categoryId: _selectedCategoryId,
        subcategory: _selectedSubcategory,
        brand: _selectedBrand,
        price: _selectedPrice,
        discount: _selectedDiscount,
        sortBy: _sortBy,
        page: append ? _page + 1 : 1,
      );

      if (!mounted) return;
      setState(() {
        if (append) {
          _products = [..._products, ...result.products];
        } else {
          _products = result.products;
        }
        _subcategories = result.subcategories;
        _hasMore = result.hasMore;
        _page = result.page;
        _loadingMore = false;
        _categoryError = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        _categoryError = 'Could not load products: $error';
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore) {
      return;
    }

    setState(() => _loadingMore = true);
    await _refreshCategory(append: true);
  }

  void _selectCategory(String id) {
    setState(() {
      _selectedCategoryId = id;
      _selectedSubcategory = '';
      _selectedBrand = '';
      _selectedPrice = '';
      _selectedDiscount = '';
      _sortBy = 'price_asc';
      _page = 1;
      _hasMore = false;
    });
    _refreshCategory();
  }

  void _showSortSheet() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Sort by',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 12),
              _SortOption(
                title: 'Price: Low to High',
                selected: _sortBy == 'price_asc',
                onTap: () {
                  setState(() => _sortBy = 'price_asc');
                  Navigator.pop(context);
                  _refreshCategory();
                },
              ),
              _SortOption(
                title: 'Price: High to Low',
                selected: _sortBy == 'price_desc',
                onTap: () {
                  setState(() => _sortBy = 'price_desc');
                  Navigator.pop(context);
                  _refreshCategory();
                },
              ),
              _SortOption(
                title: 'Discount',
                selected: _sortBy == 'discount',
                onTap: () {
                  setState(() => _sortBy = 'discount');
                  Navigator.pop(context);
                  _refreshCategory();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final wishlistIds = ref.watch(wishlistControllerProvider);

    return FutureBuilder<List<CategoryGroup>>(
      future: _groupsFuture,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          if (snapshot.hasError) {
            return Scaffold(
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('Could not load categories.'),
                    TextButton(
                      onPressed: () => setState(
                        () => _groupsFuture = ref
                            .read(categoryRepositoryProvider)
                            .getCategoryGroups(),
                      ),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }
          return Scaffold(
            body: Shimmer.fromColors(
              baseColor: Colors.grey.shade300,
              highlightColor: Colors.grey.shade100,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Container(height: 30, width: 120, color: Colors.white),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Container(width: 100, height: 80, color: Colors.white),
                      const SizedBox(width: 12),
                      Container(width: 100, height: 80, color: Colors.white),
                    ],
                  ),
                ],
              ),
            ),
          );
        }

        final groups = snapshot.data!;
        if (groups.isEmpty) {
          return const Scaffold(
            body: Center(child: Text('No product categories are available yet.')),
          );
        }
        final selectedGroup = groups.firstWhere(
          (group) => group.id == _selectedCategoryId,
          orElse: () => groups.first,
        );

        return Scaffold(
          backgroundColor: AppColors.background,
          appBar: AppBar(
            backgroundColor: AppColors.background,
            elevation: 0,
            title: const Text('Categories'),
          ),
          body: Row(
            children: [
              Container(
                width: 112,
                color: AppColors.surface,
                child: ListView.builder(
                  itemCount: groups.length,
                  itemBuilder: (context, index) {
                    final group = groups[index];
                    final selected = group.id == selectedGroup.id;
                    return InkWell(
                      onTap: () => _selectCategory(group.id),
                      child: Container(
                        margin: const EdgeInsets.fromLTRB(8, 8, 8, 0),
                        padding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 8,
                        ),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.primaryGreen
                              : AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          children: [
                            Icon(
                              group.icon,
                              color: selected
                                  ? Colors.white
                                  : AppColors.textPrimary,
                              size: 24,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              group.name,
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: selected
                                    ? Colors.white
                                    : AppColors.textPrimary,
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => _refreshCategory(),
                  child: ListView(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    children: [
                      const Text(
                        'Sub-categories',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 10),
                      if (_subcategories.isNotEmpty)
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text('All'),
                              selected: _selectedSubcategory.isEmpty,
                              onSelected: (_) {
                                setState(() => _selectedSubcategory = '');
                                _refreshCategory();
                              },
                            ),
                            ..._subcategories.map(
                              (subcategory) => ChoiceChip(
                                label: Text(subcategory),
                                selected: _selectedSubcategory == subcategory,
                                onSelected: (_) {
                                  setState(
                                    () => _selectedSubcategory = subcategory,
                                  );
                                  _refreshCategory();
                                },
                              ),
                            ),
                          ],
                        )
                      else
                        const SizedBox.shrink(),
                      const SizedBox(height: 18),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          ChoiceChip(
                            label: const Text('Brand: All'),
                            selected: _selectedBrand.isEmpty,
                            onSelected: (_) {
                              setState(() => _selectedBrand = '');
                              _refreshCategory();
                            },
                          ),
                          ChoiceChip(
                            label: const Text('Fresh Basket'),
                            selected: _selectedBrand == 'Fresh Basket',
                            onSelected: (_) {
                              setState(() => _selectedBrand = 'Fresh Basket');
                              _refreshCategory();
                            },
                          ),
                          ChoiceChip(
                            label: const Text('Nature Box'),
                            selected: _selectedBrand == 'Nature Box',
                            onSelected: (_) {
                              setState(() => _selectedBrand = 'Nature Box');
                              _refreshCategory();
                            },
                          ),
                          ChoiceChip(
                            label: const Text('Under ₹100'),
                            selected: _selectedPrice == 'under_100',
                            onSelected: (_) {
                              setState(() => _selectedPrice = 'under_100');
                              _refreshCategory();
                            },
                          ),
                          ChoiceChip(
                            label: const Text('₹100-₹200'),
                            selected: _selectedPrice == '100_200',
                            onSelected: (_) {
                              setState(() => _selectedPrice = '100_200');
                              _refreshCategory();
                            },
                          ),
                          ChoiceChip(
                            label: const Text('10%+ off'),
                            selected: _selectedDiscount == '10_plus',
                            onSelected: (_) {
                              setState(() => _selectedDiscount = '10_plus');
                              _refreshCategory();
                            },
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Text(
                            'Products',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const Spacer(),
                          TextButton.icon(
                            onPressed: _showSortSheet,
                            icon: const Icon(Icons.sort_rounded),
                            label: const Text('Sort'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      if (_categoryError != null)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 40),
                            child: Column(
                              children: [
                                Text(
                                  _categoryError!,
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 14,
                                  ),
                                ),
                                TextButton(
                                  onPressed: () => _refreshCategory(),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          ),
                        )
                      else if (_products.isEmpty)
                        const Center(
                          child: Padding(
                            padding: EdgeInsets.symmetric(vertical: 40),
                            child: Text(
                              'No products found',
                              style: TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        )
                      else
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          padding: EdgeInsets.zero,
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.76,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                          itemCount: _products.length + (_hasMore ? 1 : 0),
                          itemBuilder: (context, index) {
                            if (index == _products.length) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: _loadingMore
                                      ? const CircularProgressIndicator(
                                          color: AppColors.primaryGreen,
                                        )
                                      : FilledButton(
                                          onPressed: _loadMore,
                                          child: const Text('Load more'),
                                        ),
                                ),
                              );
                            }

                            final product = _products[index];
                            return ProductCard(
                              product: product,
                              onTap: () =>
                                  context.push('/product/${product.id}'),
                              isFavourite: wishlistIds.contains(product.id),
                              onFavouriteTap: () async {
                                await ref
                                    .read(wishlistControllerProvider.notifier)
                                    .toggle(product.id);
                              },
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _SortOption extends StatelessWidget {
  const _SortOption({
    required this.title,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        margin: const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          color: selected
              ? AppColors.primaryGreen.withValues(alpha: 0.12)
              : AppColors.background,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            if (selected)
              const Icon(Icons.check_rounded, color: AppColors.primaryGreen),
          ],
        ),
      ),
    );
  }
}
