import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/features/categories/domain/category_repository.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

final categoryRepositoryProvider = Provider<CategoryRepository>(
  (ref) => MockCategoryRepository(),
);

class MockCategoryRepository implements CategoryRepository {
  static const List<Map<String, dynamic>> _categories = [
    {
      'id': 'fruits',
      'name': 'Fruits',
      'icon': Icons.apple_rounded,
      'subcategories': ['Citrus', 'Seasonal', 'Exotics'],
    },
    {
      'id': 'veggies',
      'name': 'Vegetables',
      'icon': Icons.eco_rounded,
      'subcategories': ['Leafy', 'Roots', 'Organic'],
    },
    {
      'id': 'dairy',
      'name': 'Dairy',
      'icon': Icons.local_drink_rounded,
      'subcategories': ['Milk', 'Curd', 'Cheese'],
    },
    {
      'id': 'bakery',
      'name': 'Bakery',
      'icon': Icons.breakfast_dining_rounded,
      'subcategories': ['Bread', 'Buns', 'Cakes'],
    },
    {
      'id': 'snacks',
      'name': 'Snacks',
      'icon': Icons.cookie_rounded,
      'subcategories': ['Chips', 'Nuts', 'Cookies'],
    },
  ];

  static const List<String> _fruitSubcategories = [
    'Citrus',
    'Seasonal',
    'Citrus',
    'Exotics',
    'Seasonal',
    'Seasonal',
    'Exotics',
    'Seasonal',
  ];

  static final Map<String, List<HomeProduct>> _mockProducts = {
    'fruits': [
      for (var i = 1; i <= 24; i++)
        HomeProduct(
          id: 'fruit-$i',
          name: _fruitNames[i % _fruitNames.length],
          packSize: '${(i % 4) + 1} kg',
          imageUrl:
              'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
          sellingPrice: 40 + (i * 7),
          mrp: 55 + (i * 8),
          discountPercent: 10 + (i % 25),
          isFavourite: i.isEven,
          brand: i.isEven ? 'Fresh Basket' : 'Nature Box',
          keywords: [
            'fruit',
            _fruitNames[i % _fruitNames.length].toLowerCase(),
          ],
          subcategory: _fruitSubcategories[i % _fruitSubcategories.length],
        ),
    ],
    'veggies': [
      for (var i = 1; i <= 18; i++)
        HomeProduct(
          id: 'veg-$i',
          name: _vegNames[i % _vegNames.length],
          packSize: '${(i % 3) + 1} kg',
          imageUrl:
              'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
          sellingPrice: 35 + (i * 5),
          mrp: 45 + (i * 6),
          discountPercent: 12 + (i % 20),
          isFavourite: i.isOdd,
          brand: 'Green Harvest',
          keywords: ['vegetable', 'fresh'],
        ),
    ],
    'dairy': [
      for (var i = 1; i <= 18; i++)
        HomeProduct(
          id: 'dairy-$i',
          name: _dairyNames[i % _dairyNames.length],
          packSize: '${(i % 4) + 1} L',
          imageUrl:
              'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
          sellingPrice: 55 + (i * 9),
          mrp: 70 + (i * 10),
          discountPercent: 15 + (i % 18),
          isFavourite: i.isEven,
          brand: 'Farm Fresh',
          keywords: ['dairy', 'milk', 'protein'],
        ),
    ],
    'bakery': [
      for (var i = 1; i <= 18; i++)
        HomeProduct(
          id: 'bakery-$i',
          name: _bakeryNames[i % _bakeryNames.length],
          packSize: '${(i % 3) + 1} pcs',
          imageUrl:
              'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
          sellingPrice: 50 + (i * 6),
          mrp: 69 + (i * 8),
          discountPercent: 18 + (i % 20),
          isFavourite: i.isOdd,
          brand: 'Bake House',
          keywords: ['bread', 'bakery', 'fresh'],
        ),
    ],
    'snacks': [
      for (var i = 1; i <= 18; i++)
        HomeProduct(
          id: 'snacks-$i',
          name: _snackNames[i % _snackNames.length],
          packSize: '${(i % 3) + 1} pack',
          imageUrl:
              'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=800&q=80',
          sellingPrice: 30 + (i * 4),
          mrp: 39 + (i * 6),
          discountPercent: 10 + (i % 22),
          isFavourite: i.isEven,
          brand: 'Snack Yard',
          keywords: ['snack', 'healthy', 'tasty'],
        ),
    ],
  };

  static const List<String> _fruitNames = [
    'Orange',
    'Mango',
    'Grapes',
    'Kiwi',
    'Banana',
    'Apple',
    'Papaya',
    'Pear',
  ];

  static const List<String> _vegNames = [
    'Spinach',
    'Tomato',
    'Onion',
    'Carrot',
    'Cucumber',
    'Broccoli',
  ];

  static const List<String> _dairyNames = [
    'Amul Milk',
    'Greek Yogurt',
    'Cheddar Slice',
    'Paneer',
    'Low Fat Milk',
  ];

  static const List<String> _bakeryNames = [
    'Brown Bread',
    'Soft Bun',
    'Cinnamon Roll',
    'Whole Wheat Loaf',
  ];

  static const List<String> _snackNames = [
    'Masala Chips',
    'Trail Mix',
    'Oat Cookies',
    'Roasted Nuts',
  ];

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
    final group = _categories.firstWhere(
      (item) => item['id'] == categoryId,
      orElse: () => _categories.first,
    );
    final items = List<HomeProduct>.from(_mockProducts[categoryId] ?? const []);

    var filtered = items;
    if (subcategory != null && subcategory.isNotEmpty) {
      filtered = filtered.where((product) {
        final normalized = subcategory.toLowerCase();
        final name = product.name.toLowerCase();
        final productSubcategory = product.subcategory.toLowerCase();
        return name.contains(normalized) ||
            productSubcategory == normalized ||
            product.keywords.any(
              (keyword) =>
                  keyword.toLowerCase().contains(normalized) ||
                  keyword.toLowerCase() == normalized,
            );
      }).toList();
    }

    if (brand != null && brand.isNotEmpty) {
      filtered = filtered.where((product) => product.brand == brand).toList();
    }

    if (price != null && price.isNotEmpty) {
      if (price == 'under_100') {
        filtered = filtered
            .where((product) => product.sellingPrice < 100)
            .toList();
      } else if (price == '100_200') {
        filtered = filtered
            .where(
              (product) =>
                  product.sellingPrice >= 100 && product.sellingPrice <= 200,
            )
            .toList();
      }
    }

    if (discount != null && discount.isNotEmpty) {
      if (discount == '10_plus') {
        filtered = filtered
            .where((product) => product.discountPercent >= 10)
            .toList();
      }
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
    }

    final start = (page - 1) * 10;
    final pageItems = filtered.skip(start).take(10).toList();
    final hasMore = start + 10 < filtered.length;

    return CategoryDetailResult(
      category: CategoryGroup(
        id: group['id'] as String,
        name: group['name'] as String,
        icon: group['icon'] as IconData,
        subcategories: List<String>.from(group['subcategories'] as List),
      ),
      products: pageItems,
      hasMore: hasMore,
      page: page,
      subcategories: List<String>.from(group['subcategories'] as List),
    );
  }

  @override
  Future<List<CategoryGroup>> getCategoryGroups() async {
    return _categories
        .map(
          (item) => CategoryGroup(
            id: item['id'] as String,
            name: item['name'] as String,
            icon: item['icon'] as IconData,
            subcategories: List<String>.from(item['subcategories'] as List),
          ),
        )
        .toList();
  }
}
