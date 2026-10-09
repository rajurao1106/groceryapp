import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/product_detail/data/mock_product_detail_repository.dart';
import 'package:grocery_app/features/product_detail/domain/product_detail_repository.dart';
import 'package:grocery_app/features/product_detail/presentation/product_detail_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _product = HomeProduct(
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

const _detail = ProductDetail(
  product: _product,
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

void main() {
  testWidgets('adding a product reveals quantity and view cart controls', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productDetailProvider(
            'test-product',
          ).overrideWith((ref) async => _detail),
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

  testWidgets('view cart navigates from product detail to the cart tab', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final router = GoRouter(
      initialLocation: '/home',
      routes: [
        ShellRoute(
          builder: (context, state, child) => child,
          routes: [
            StatefulShellRoute.indexedStack(
              builder: (context, state, navigationShell) => navigationShell,
              branches: [
                StatefulShellBranch(
                  routes: [
                    GoRoute(
                      path: '/home',
                      builder: (context, state) => Scaffold(
                        body: TextButton(
                          onPressed: () =>
                              context.push('/product/test-product'),
                          child: const Text('Open product'),
                        ),
                      ),
                    ),
                  ],
                ),
                StatefulShellBranch(
                  routes: [
                    GoRoute(
                      path: '/cart',
                      builder: (context, state) =>
                          const Scaffold(body: Text('Cart destination')),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        GoRoute(
          path: '/product/:id',
          builder: (context, state) =>
              ProductDetailScreen(productId: state.pathParameters['id']!),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          productDetailProvider(
            'test-product',
          ).overrideWith((ref) async => _detail),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open product'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('ADD  ·  ₹100'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('View cart'));
    await tester.pumpAndSettle();

    expect(find.text('Cart destination'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
