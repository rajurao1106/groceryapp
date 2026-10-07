import 'package:grocery_app/features/home/domain/home_repository.dart';

abstract class ProductDetailRepository {
  Future<ProductDetail?> getProductDetail(String productId);
}

class ProductDetail {
  const ProductDetail({
    required this.product,
    required this.images,
    required this.variants,
    required this.highlights,
    required this.description,
    required this.relatedProducts,
    required this.alternativeProducts,
  });

  final HomeProduct product;
  final List<String> images;
  final List<ProductVariant> variants;
  final Map<String, String> highlights;
  final String description;
  final List<HomeProduct> relatedProducts;
  final List<HomeProduct> alternativeProducts;
}

class ProductVariant {
  const ProductVariant({
    required this.label,
    required this.packSize,
    required this.sellingPrice,
    required this.mrp,
    required this.stock,
  });

  final String label;
  final String packSize;
  final double sellingPrice;
  final double mrp;
  final int stock;

  HomeProduct applyTo(HomeProduct product) {
    final discount = mrp <= 0
        ? 0
        : (((mrp - sellingPrice) / mrp) * 100).round();
    return product.copyWith(
      packSize: packSize,
      sellingPrice: sellingPrice,
      mrp: mrp,
      discountPercent: discount,
      stock: stock,
    );
  }
}
