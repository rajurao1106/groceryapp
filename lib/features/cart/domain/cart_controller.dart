import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:grocery_app/features/home/domain/home_repository.dart';

class CartItem {
  const CartItem({required this.product, required this.quantity});

  final HomeProduct product;
  final int quantity;

  CartItem copyWith({HomeProduct? product, int? quantity}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
    );
  }

  Map<String, dynamic> toJson() => {
    'product': product.toJson(),
    'quantity': quantity,
  };

  factory CartItem.fromJson(Map<String, dynamic> json) {
    return CartItem(
      product: HomeProduct.fromJson(
        json['product'] as Map<String, dynamic>? ?? const {},
      ),
      quantity: json['quantity'] as int? ?? 1,
    );
  }
}

final cartControllerProvider = NotifierProvider<CartController, List<CartItem>>(
  CartController.new,
);

class CartController extends Notifier<List<CartItem>> {
  static const String _prefKey = 'cart_items';

  @override
  List<CartItem> build() {
    load();
    return const [];
  }

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final encoded = prefs.getString(_prefKey);
    if (encoded == null || encoded.isEmpty) {
      state = const [];
      return;
    }

    final decoded = jsonDecode(encoded) as List<dynamic>? ?? const [];
    state = decoded
        .map((item) => CartItem.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> _persist() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _prefKey,
      jsonEncode(state.map((item) => item.toJson()).toList()),
    );
  }

  Future<void> addProduct(HomeProduct product, {int quantity = 1}) async {
    if (product.stock <= 0) {
      return;
    }

    final next = [...state];
    final index = next.indexWhere((item) => item.product.id == product.id);
    if (index >= 0) {
      final existing = next[index];
      final targetQty = existing.quantity + quantity;
      next[index] = existing.copyWith(
        quantity: targetQty > product.stock ? product.stock : targetQty,
      );
    } else {
      final targetQty = quantity > product.stock ? product.stock : quantity;
      next.add(CartItem(product: product, quantity: targetQty));
    }

    state = next;
    await _persist();
  }

  Future<void> increase(String productId) async {
    final index = state.indexWhere((item) => item.product.id == productId);
    if (index < 0) {
      return;
    }

    final item = state[index];
    if (item.quantity >= item.product.stock) {
      return;
    }

    final next = [...state];
    next[index] = item.copyWith(quantity: item.quantity + 1);
    state = next;
    await _persist();
  }

  Future<void> decrease(String productId) async {
    final index = state.indexWhere((item) => item.product.id == productId);
    if (index < 0) {
      return;
    }

    final item = state[index];
    if (item.quantity <= 1) {
      await remove(productId);
      return;
    }

    final next = [...state];
    next[index] = item.copyWith(quantity: item.quantity - 1);
    state = next;
    await _persist();
  }

  Future<void> remove(String productId) async {
    state = state.where((item) => item.product.id != productId).toList();
    await _persist();
  }

  Future<void> clear() async {
    state = const [];
    await _persist();
  }
}
