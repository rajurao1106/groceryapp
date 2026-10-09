import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/home/presentation/catalog_product_image.dart';

void main() {
  testWidgets('renders catalog emoji values instead of a broken image icon', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: SizedBox(
            width: 180,
            height: 112,
            child: CatalogProductImage(image: '🥒'),
          ),
        ),
      ),
    );

    expect(find.text('🥒'), findsOneWidget);
    expect(find.byIcon(Icons.image_not_supported_outlined), findsNothing);
  });
}
