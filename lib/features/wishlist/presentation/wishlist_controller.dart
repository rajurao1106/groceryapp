import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final wishlistControllerProvider =
    NotifierProvider<WishlistController, List<String>>(WishlistController.new);

class WishlistController extends Notifier<List<String>> {
  static const String _prefKey = 'wishlist_product_ids';
  int _version = 0;

  @override
  List<String> build() {
    load();
    return const [];
  }

  Future<void> load() async {
    final version = ++_version;
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_prefKey) ?? const [];
    if (version == _version) {
      state = saved;
    }
  }

  Future<void> toggle(String productId) async {
    final next = List<String>.from(state);
    if (next.contains(productId)) {
      next.remove(productId);
    } else {
      next.add(productId);
    }

    _version += 1;
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefKey, next);
  }

  Future<void> remove(String productId) async {
    final next = List<String>.from(state)..remove(productId);
    _version += 1;
    state = next;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_prefKey, next);
  }

  bool contains(String productId) => state.contains(productId);
}
