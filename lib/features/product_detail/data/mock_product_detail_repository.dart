import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/features/home/data/mock_home_repository.dart';
import 'package:grocery_app/features/product_detail/domain/product_detail_repository.dart';

final productDetailRepositoryProvider = Provider<ProductDetailRepository>(
  (ref) => MockProductDetailRepository(ref),
);

final productDetailProvider = FutureProvider.family<ProductDetail?, String>(
  (ref, productId) =>
      ref.watch(productDetailRepositoryProvider).getProductDetail(productId),
);

class MockProductDetailRepository implements ProductDetailRepository {
  MockProductDetailRepository(this._ref);

  final Ref _ref;

  @override
  Future<ProductDetail?> getProductDetail(String productId) async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final page = await _ref.read(homePageProvider.future);
    final sections = page.sections;
    final products = sections.expand((section) => section.products).toList();
    final productIndex = products.indexWhere((item) => item.id == productId);
    if (productIndex < 0) {
      return null;
    }

    final product = products[productIndex];
    final section = sections.firstWhere(
      (item) => item.products.any((candidate) => candidate.id == productId),
    );
    final galleryImages = [
      product.imageUrl,
      ...section.products
          .where((candidate) => candidate.id != productId)
          .map((candidate) => candidate.imageUrl),
    ].where((url) => url.isNotEmpty).take(4).toList();
    final alternativeProducts = products
        .where((candidate) => candidate.id != productId)
        .take(4)
        .toList();
    final variant = ProductVariant(
      label: product.packSize,
      packSize: product.packSize,
      sellingPrice: product.sellingPrice,
      mrp: product.mrp,
      stock: product.stock,
    );
    final bulkVariant = ProductVariant(
      label: '2 x ${product.packSize}',
      packSize: '2 x ${product.packSize}',
      sellingPrice: product.sellingPrice * 2,
      mrp: product.mrp * 2,
      stock: product.stock,
    );

    return ProductDetail(
      product: product,
      images: galleryImages,
      variants: [variant, bulkVariant],
      highlights: {
        'Brand': product.brand.isEmpty ? 'GroceryGo Select' : product.brand,
        'Weight': product.packSize,
        'Shelf life': '3-5 days',
        'Storage': 'Store in a cool, dry place',
      },
      description:
          '${product.name} is carefully selected for freshness and quality. '
          'Packed with care and delivered to your doorstep. Enjoy it as part '
          'of your everyday meals and snacks.',
      relatedProducts: section.products
          .where((candidate) => candidate.id != productId)
          .toList(),
      alternativeProducts: alternativeProducts,
    );
  }
}
