abstract class HomeRepository {
  Future<HomePageData> getHomePage();
}

class HomePageData {
  const HomePageData({
    required this.banners,
    required this.categories,
    required this.sections,
  });

  final List<HomeBanner> banners;
  final List<HomeCategory> categories;
  final List<HomeSection> sections;

  factory HomePageData.fromJson(Map<String, dynamic> json) {
    final bannerList = (json['banners'] as List<dynamic>? ?? const [])
        .map((item) => HomeBanner.fromJson(item as Map<String, dynamic>))
        .toList();

    final categoryList = (json['categories'] as List<dynamic>? ?? const [])
        .map((item) => HomeCategory.fromJson(item as Map<String, dynamic>))
        .toList();

    final sectionList = (json['sections'] as List<dynamic>? ?? const [])
        .map((item) => HomeSection.fromJson(item as Map<String, dynamic>))
        .toList();

    return HomePageData(
      banners: bannerList,
      categories: categoryList,
      sections: sectionList,
    );
  }
}

class HomeBanner {
  const HomeBanner({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
  });

  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;

  factory HomeBanner.fromJson(Map<String, dynamic> json) {
    return HomeBanner(
      id: json['id']?.toString() ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
    );
  }
}

class HomeCategory {
  const HomeCategory({
    required this.id,
    required this.name,
    required this.imageUrl,
  });

  final String id;
  final String name;
  final String imageUrl;

  factory HomeCategory.fromJson(Map<String, dynamic> json) {
    return HomeCategory(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
    );
  }
}

class HomeSection {
  const HomeSection({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.products,
  });

  final String id;
  final String title;
  final String subtitle;
  final List<HomeProduct> products;

  factory HomeSection.fromJson(Map<String, dynamic> json) {
    final productList = (json['products'] as List<dynamic>? ?? const [])
        .map((item) => HomeProduct.fromJson(item as Map<String, dynamic>))
        .toList();

    return HomeSection(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String? ?? '',
      products: productList,
    );
  }
}

class HomeProduct {
  const HomeProduct({
    required this.id,
    required this.name,
    required this.packSize,
    required this.imageUrl,
    required this.sellingPrice,
    required this.mrp,
    required this.discountPercent,
    required this.isFavourite,
    this.brand = '',
    this.keywords = const [],
    this.subcategory = '',
    this.stock = 0,
  });

  final String id;
  final String name;
  final String packSize;
  final String imageUrl;
  final double sellingPrice;
  final double mrp;
  final int discountPercent;
  final bool isFavourite;
  final String brand;
  final List<String> keywords;
  final String subcategory;
  final int stock;

  HomeProduct copyWith({
    String? id,
    String? name,
    String? packSize,
    String? imageUrl,
    double? sellingPrice,
    double? mrp,
    int? discountPercent,
    bool? isFavourite,
    String? brand,
    List<String>? keywords,
    String? subcategory,
    int? stock,
  }) {
    return HomeProduct(
      id: id ?? this.id,
      name: name ?? this.name,
      packSize: packSize ?? this.packSize,
      imageUrl: imageUrl ?? this.imageUrl,
      sellingPrice: sellingPrice ?? this.sellingPrice,
      mrp: mrp ?? this.mrp,
      discountPercent: discountPercent ?? this.discountPercent,
      isFavourite: isFavourite ?? this.isFavourite,
      brand: brand ?? this.brand,
      keywords: keywords ?? this.keywords,
      subcategory: subcategory ?? this.subcategory,
      stock: stock ?? this.stock,
    );
  }

  factory HomeProduct.fromJson(Map<String, dynamic> json) {
    final keywordList = (json['keywords'] as List<dynamic>? ?? const [])
        .map((value) => value.toString())
        .toList();

    return HomeProduct(
      id: json['id']?.toString() ?? '',
      name: json['name'] as String? ?? '',
      packSize: json['packSize'] as String? ?? '1 pack',
      imageUrl: json['imageUrl'] as String? ?? '',
      sellingPrice: (json['sellingPrice'] as num?)?.toDouble() ?? 0,
      mrp: (json['mrp'] as num?)?.toDouble() ?? 0,
      discountPercent: json['discountPercent'] as int? ?? 0,
      isFavourite: json['isFavourite'] as bool? ?? false,
      brand: json['brand'] as String? ?? '',
      keywords: keywordList,
      subcategory: json['subcategory'] as String? ?? '',
      stock: json['stock'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'packSize': packSize,
    'imageUrl': imageUrl,
    'sellingPrice': sellingPrice,
    'mrp': mrp,
    'discountPercent': discountPercent,
    'isFavourite': isFavourite,
    'brand': brand,
    'keywords': keywords,
    'subcategory': subcategory,
    'stock': stock,
  };
}
