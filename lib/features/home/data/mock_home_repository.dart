import 'dart:convert';

import 'package:grocery_app/features/home/domain/home_repository.dart';

export 'backend_home_repository.dart'
    show homePageProvider, homeRepositoryProvider;

class MockHomeRepository implements HomeRepository {
  static const Map<String, dynamic> _fakeJson = {
    'banners': [
      {
        'id': 'banner-1',
        'title': 'Fresh groceries',
        'subtitle': 'Up to 40% off today',
        'imageUrl':
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80',
      },
      {
        'id': 'banner-2',
        'title': 'Organic picks',
        'subtitle': 'Farm fresh and hygienic',
        'imageUrl':
            'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80',
      },
      {
        'id': 'banner-3',
        'title': 'Daily essentials',
        'subtitle': 'Save more on household needs',
        'imageUrl':
            'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=80',
      },
    ],
    'categories': [
      {
        'id': 'veg',
        'name': 'Vegetables',
        'imageUrl':
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'fruits',
        'name': 'Fruits',
        'imageUrl':
            'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'dairy',
        'name': 'Dairy',
        'imageUrl':
            'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'bakery',
        'name': 'Bakery',
        'imageUrl':
            'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'snacks',
        'name': 'Snacks',
        'imageUrl':
            'https://images.unsplash.com/photo-1562967916-eb82221dfb92?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'beverages',
        'name': 'Beverages',
        'imageUrl':
            'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'cleaning',
        'name': 'Cleaning',
        'imageUrl':
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80',
      },
      {
        'id': 'more',
        'name': 'More',
        'imageUrl':
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      },
    ],
    'sections': [
      {
        'id': 'top-sellers',
        'title': 'Top picks for you',
        'subtitle': 'Most loved essentials',
        'products': [
          {
            'id': 'p1',
            'name': 'Royal Gala Apples',
            'packSize': '1 kg',
            'imageUrl':
                'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 189,
            'mrp': 249,
            'discountPercent': 24,
            'isFavourite': true,
          },
          {
            'id': 'p2',
            'name': 'Avocado',
            'packSize': '2 pcs',
            'imageUrl':
                'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 149,
            'mrp': 199,
            'discountPercent': 25,
            'isFavourite': false,
          },
          {
            'id': 'p3',
            'name': 'Farm Fresh Spinach',
            'packSize': '250 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 59,
            'mrp': 79,
            'discountPercent': 25,
            'isFavourite': true,
          },
          {
            'id': 'p4',
            'name': 'Bananas',
            'packSize': '1 bunch',
            'imageUrl':
                'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 64,
            'mrp': 89,
            'discountPercent': 28,
            'isFavourite': false,
          },
        ],
      },
      {
        'id': 'household',
        'title': 'Household favorites',
        'subtitle': 'Everyday essentials at happy prices',
        'products': [
          {
            'id': 'p5',
            'name': 'Whole Wheat Bread',
            'packSize': '400 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 75,
            'mrp': 99,
            'discountPercent': 24,
            'isFavourite': false,
          },
          {
            'id': 'p6',
            'name': 'Amul Milk',
            'packSize': '1 L',
            'imageUrl':
                'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 66,
            'mrp': 82,
            'discountPercent': 20,
            'isFavourite': true,
          },
          {
            'id': 'p7',
            'name': 'Protein Snack Box',
            'packSize': '180 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 210,
            'mrp': 299,
            'discountPercent': 30,
            'isFavourite': false,
          },
          {
            'id': 'p8',
            'name': 'Orange Juice',
            'packSize': '1 L',
            'imageUrl':
                'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 110,
            'mrp': 149,
            'discountPercent': 26,
            'isFavourite': false,
          },
        ],
      },
      {
        'id': 'quick-bites',
        'title': 'Quick bites',
        'subtitle': 'Fast snacks for every craving',
        'products': [
          {
            'id': 'p9',
            'name': 'Mini Cookies',
            'packSize': '150 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1499636136210-6d847e70c0f7?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 89,
            'mrp': 129,
            'discountPercent': 31,
            'isFavourite': false,
          },
          {
            'id': 'p10',
            'name': 'Fruit Yogurt',
            'packSize': '200 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 79,
            'mrp': 99,
            'discountPercent': 20,
            'isFavourite': false,
          },
          {
            'id': 'p11',
            'name': 'Cucumber',
            'packSize': '500 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1449300079323-02e209d1d3f5?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 39,
            'mrp': 55,
            'discountPercent': 29,
            'isFavourite': true,
          },
          {
            'id': 'p12',
            'name': 'Seasonal Mix',
            'packSize': '900 g',
            'imageUrl':
                'https://images.unsplash.com/photo-1518843875459-f738682238a6?auto=format&fit=crop&w=800&q=80',
            'sellingPrice': 239,
            'mrp': 329,
            'discountPercent': 27,
            'isFavourite': false,
          },
        ],
      },
    ],
  };

  @override
  Future<HomePageData> getHomePage() async {
    await Future<void>.delayed(const Duration(milliseconds: 900));

    final decoded = jsonDecode(jsonEncode(_fakeJson)) as Map<String, dynamic>;
    for (final section in decoded['sections'] as List<dynamic>) {
      final products =
          (section as Map<String, dynamic>)['products'] as List<dynamic>;
      for (final item in products) {
        final product = item as Map<String, dynamic>;
        product['stock'] = product['id'] == 'p3' ? 0 : 18;
      }
    }
    return HomePageData.fromJson(decoded);
  }
}
