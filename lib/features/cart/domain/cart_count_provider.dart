import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:grocery_app/features/cart/domain/cart_controller.dart';

final cartItemCountProvider = Provider<int>((ref) {
  final cart = ref.watch(cartControllerProvider);
  return cart.fold<int>(0, (count, item) => count + item.quantity);
});

final cartTotalProvider = Provider<double>((ref) {
  final cart = ref.watch(cartControllerProvider);
  return cart.fold<double>(
    0,
    (total, item) => total + (item.product.sellingPrice * item.quantity),
  );
});
