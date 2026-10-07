import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/core/storage/app_preferences.dart';
import 'package:grocery_app/features/home/data/mock_home_repository.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/search/domain/search_repository.dart';

final searchRepositoryProvider = Provider<SearchRepository>(
  (ref) => MockSearchRepository(ref.read(homeRepositoryProvider)),
);

class MockSearchRepository implements SearchRepository {
  MockSearchRepository(this._homeRepository);

  final HomeRepository _homeRepository;

  static const List<String> _popularSuggestions = [
    'Fresh fruits',
    'Organic veggies',
    'Milk',
    'Bread',
    'Juice',
    'Snacks',
  ];

  @override
  Future<List<HomeProduct>> search(String query) async {
    final normalized = query.trim();
    if (normalized.isEmpty) {
      return const [];
    }

    final page = await _homeRepository.getHomePage();
    final groupedProducts = <HomeProduct>[];

    for (final section in page.sections) {
      groupedProducts.addAll(section.products);
    }

    final loweredQuery = normalized.toLowerCase();
    final matches = groupedProducts.where((product) {
      final haystack = [
        product.name,
        product.brand,
        product.packSize,
        ...product.keywords,
      ].join(' ').toLowerCase();

      return haystack.contains(loweredQuery);
    }).toList();

    return matches;
  }

  @override
  Future<List<String>> getRecentSearches() async {
    return AppPreferences.getRecentSearches();
  }

  @override
  Future<void> addRecentSearch(String query) async {
    await AppPreferences.saveRecentSearch(query);
  }

  @override
  Future<void> clearRecentSearches() async {
    await AppPreferences.clearRecentSearches();
  }

  @override
  Future<List<String>> getPopularSuggestions() async {
    return _popularSuggestions;
  }
}
