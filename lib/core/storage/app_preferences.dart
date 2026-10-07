import 'package:shared_preferences/shared_preferences.dart';

class AppPreferences {
  AppPreferences._();

  static const String _authFlagKey = 'auth_flag';
  static const String _onboardingCompletedKey = 'onboarding_completed';
  static const String _recentSearchesKey = 'recent_searches';
  static const String _wishlistProductIdsKey = 'wishlist_product_ids';
  static const String _profileUserKey = 'profile_user';
  static const String _savedAddressesKey = 'saved_addresses';

  static Future<void> setLoggedInFlag(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_authFlagKey, value);
  }

  static Future<bool> isLoggedInFlagSet() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_authFlagKey) ?? false;
  }

  static Future<void> setOnboardingCompleted(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingCompletedKey, value);
  }

  static Future<bool> isOnboardingCompleted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingCompletedKey) ?? false;
  }

  static Future<List<String>> getRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_recentSearchesKey) ?? const [];
  }

  static Future<void> saveRecentSearch(String value) async {
    final trimmed = value.trim();
    if (trimmed.isEmpty) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final current = prefs.getStringList(_recentSearchesKey) ?? const [];
    final next = [trimmed, ...current.where((item) => item != trimmed)];

    await prefs.setStringList(_recentSearchesKey, next.take(8).toList());
  }

  static Future<void> clearRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentSearchesKey);
  }

  static Future<List<String>> getWishlistProductIds() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList(_wishlistProductIdsKey) ?? const [];
  }

  static Future<void> saveWishlistProductIds(List<String> productIds) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_wishlistProductIdsKey, productIds);
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_authFlagKey);
    await prefs.remove(_onboardingCompletedKey);
    await prefs.remove(_recentSearchesKey);
    await prefs.remove(_wishlistProductIdsKey);
    await prefs.remove(_profileUserKey);
    await prefs.remove(_savedAddressesKey);
  }
}
