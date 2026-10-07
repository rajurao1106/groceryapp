import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/home/presentation/product_card.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  testWidgets('ProductCard shows add action and updates cart quantity', (
    tester,
  ) async {
    const product = HomeProduct(
      id: 'p-200',
      name: 'Banana',
      packSize: '1 bunch',
      imageUrl: 'https://example.com/banana.png',
      sellingPrice: 60,
      mrp: 80,
      discountPercent: 25,
      isFavourite: false,
      stock: 5,
    );

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: Center(child: ProductCard(product: product)),
          ),
        ),
      ),
    );

    expect(find.text('ADD'), findsOneWidget);

    await tester.tap(find.text('ADD'));
    await tester.pumpAndSettle();

    expect(find.text('1'), findsOneWidget);
  });
}
