import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/product_detail/data/mock_product_detail_repository.dart';
import 'package:grocery_app/features/product_detail/domain/product_detail_repository.dart';
import 'package:grocery_app/features/product_detail/presentation/product_detail_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  testWidgets('adding a product reveals quantity and view cart controls', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    const product = HomeProduct(
      id: 'test-product',
      name: 'Fresh Apples',
      packSize: '1 kg',
      imageUrl: '',
      sellingPrice: 100,
      mrp: 120,
      discountPercent: 17,
      isFavourite: false,
      stock: 5,
    );
    const detail = ProductDetail(
      product: product,
      images: [],
      variants: [
        ProductVariant(
          label: '1 kg',
          packSize: '1 kg',
          sellingPrice: 100,
          mrp: 120,
          stock: 5,
        ),
      ],
      highlights: {'Brand': 'Farm Select'},
      description: 'Fresh apples.',
      relatedProducts: [],
      alternativeProducts: [],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productDetailProvider(
            'test-product',
          ).overrideWith((ref) async => detail),
        ],
        child: const MaterialApp(
          home: ProductDetailScreen(productId: 'test-product'),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Fresh Apples'), findsNWidgets(2));
    expect(find.text('Delivery in 10 mins'), findsOneWidget);
    expect(find.text('ADD  ·  ₹100'), findsOneWidget);

    await tester.tap(find.text('ADD  ·  ₹100'));
    await tester.pumpAndSettle();

    expect(find.byTooltip('Decrease quantity'), findsOneWidget);
    expect(find.text('View cart'), findsOneWidget);
  });
}
