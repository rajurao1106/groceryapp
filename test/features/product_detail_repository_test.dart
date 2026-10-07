import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/home/data/mock_home_repository.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/product_detail/data/mock_product_detail_repository.dart';

void main() {
  final products = [
    const HomeProduct(
      id: 'p1',
      name: 'Apples',
      packSize: '1 kg',
      imageUrl: 'https://example.com/apples.jpg',
      sellingPrice: 100,
      mrp: 120,
      discountPercent: 17,
      isFavourite: false,
      stock: 10,
    ),
    const HomeProduct(
      id: 'p2',
      name: 'Oranges',
      packSize: '1 kg',
      imageUrl: 'https://example.com/oranges.jpg',
      sellingPrice: 80,
      mrp: 100,
      discountPercent: 20,
      isFavourite: false,
      stock: 10,
    ),
    const HomeProduct(
      id: 'p3',
      name: 'Pears',
      packSize: '500 g',
      imageUrl: 'https://example.com/pears.jpg',
      sellingPrice: 70,
      mrp: 90,
      discountPercent: 22,
      isFavourite: false,
      stock: 10,
    ),
    const HomeProduct(
      id: 'p4',
      name: 'Plums',
      packSize: '500 g',
      imageUrl: 'https://example.com/plums.jpg',
      sellingPrice: 60,
      mrp: 80,
      discountPercent: 25,
      isFavourite: false,
      stock: 10,
    ),
  ];
  final homePage = HomePageData(
    banners: const [],
    categories: const [],
    sections: [
      HomeSection(
        id: 'fruit',
        title: 'Fruit',
        subtitle: 'Fresh fruit',
        products: products,
      ),
    ],
  );

  late ProviderContainer container;

  setUp(() {
    container = ProviderContainer(
      overrides: [homePageProvider.overrideWith((ref) async => homePage)],
    );
  });

  tearDown(() => container.dispose());

  test(
    'returns gallery, highlights, and related products for a known ID',
    () async {
      final detail = await container.read(productDetailProvider('p1').future);

      expect(detail, isNotNull);
      expect(detail!.images, hasLength(4));
      expect(detail.highlights, contains('Brand'));
      expect(
        detail.relatedProducts.map((product) => product.id),
        contains('p2'),
      );
      expect(detail.variants, hasLength(2));
    },
  );

  test('returns null for an unknown ID', () async {
    final detail = await container.read(
      productDetailProvider('missing').future,
    );

    expect(detail, isNull);
  });
}
