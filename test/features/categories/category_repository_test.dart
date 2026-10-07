import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/categories/data/mock_category_repository.dart';
import 'package:grocery_app/features/categories/domain/category_repository.dart';

void main() {
  late CategoryRepository repository;

  setUp(() {
    repository = MockCategoryRepository();
  });

  test(
    'returns products for the selected category with pagination metadata',
    () async {
      final result = await repository.getCategoryDetails(
        categoryId: 'fruits',
        page: 1,
      );

      expect(result.category.id, 'fruits');
      expect(result.products.length, 10);
      expect(result.hasMore, isTrue);
    },
  );

  test('can filter by subcategory and sort by price ascending', () async {
    final result = await repository.getCategoryDetails(
      categoryId: 'fruits',
      subcategory: 'Citrus',
      sortBy: 'price_asc',
      page: 1,
    );

    expect(result.products, isNotEmpty);
    expect(
      result.products.every(
        (product) =>
            product.name.toLowerCase().contains('orange') ||
            product.name.toLowerCase().contains('mango') ||
            product.name.toLowerCase().contains('grape') ||
            product.name.toLowerCase().contains('kiwi') ||
            product.name.toLowerCase().contains('lemon'),
      ),
      isTrue,
    );
  });
}
