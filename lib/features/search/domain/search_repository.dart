import 'package:grocery_app/features/home/domain/home_repository.dart';

abstract class SearchRepository {
  Future<List<HomeProduct>> search(String query);
  Future<List<String>> getRecentSearches();
  Future<void> addRecentSearch(String query);
  Future<void> clearRecentSearches();
  Future<List<String>> getPopularSuggestions();
}
