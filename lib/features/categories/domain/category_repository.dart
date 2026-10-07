import 'package:flutter/material.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

abstract class CategoryRepository {
  Future<CategoryDetailResult> getCategoryDetails({
    required String categoryId,
    String? subcategory,
    String? brand,
    String? price,
    String? discount,
    String? sortBy,
    int page = 1,
  });

  Future<List<CategoryGroup>> getCategoryGroups();
}

class CategoryGroup {
  const CategoryGroup({
    required this.id,
    required this.name,
    required this.icon,
    required this.subcategories,
  });

  final String id;
  final String name;
  final IconData icon;
  final List<String> subcategories;
}

class CategoryDetailResult {
  const CategoryDetailResult({
    required this.category,
    required this.products,
    required this.hasMore,
    required this.page,
    required this.subcategories,
  });

  final CategoryGroup category;
  final List<HomeProduct> products;
  final bool hasMore;
  final int page;
  final List<String> subcategories;
}
