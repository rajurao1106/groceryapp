import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/search/data/mock_search_repository.dart';
import 'package:grocery_app/features/search/domain/search_repository.dart';

void main() {
  late SearchRepository repository;

  setUp(() {
    repository = MockSearchRepository(_TestHomeRepository());
  });

  test('search matches product names and keywords', () async {
    final results = await repository.search('apple');

    expect(results, isNotEmpty);
    expect(
      results.any((product) => product.name.toLowerCase().contains('apple')),
      isTrue,
    );
  });

  test('search matches brand and keyword metadata', () async {
    final results = await repository.search('organic');

    expect(results, isNotEmpty);
    expect(
      results.any(
        (product) => product.keywords.any(
          (keyword) => keyword.toLowerCase().contains('organic'),
        ),
      ),
      isTrue,
    );
  });
}

class _TestHomeRepository implements HomeRepository {
  @override
  Future<HomePageData> getHomePage() async {
    return HomePageData(
      banners: const [],
      categories: const [],
      sections: [
        HomeSection(
          id: 'test',
          title: 'Test',
          subtitle: 'Test results',
          products: [
            const HomeProduct(
              id: 'p1',
              name: 'Royal Gala Apples',
              packSize: '1 kg',
              imageUrl: 'https://example.com/apple.jpg',
              sellingPrice: 189,
              mrp: 249,
              discountPercent: 24,
              isFavourite: true,
              brand: 'Fresh Basket',
              keywords: ['apple', 'organic', 'fruit'],
            ),
            const HomeProduct(
              id: 'p2',
              name: 'Avocado',
              packSize: '2 pcs',
              imageUrl: 'https://example.com/avocado.jpg',
              sellingPrice: 149,
              mrp: 199,
              discountPercent: 25,
              isFavourite: false,
              brand: 'Green Harvest',
              keywords: ['green', 'healthy'],
            ),
          ],
        ),
      ],
    );
  }
}
