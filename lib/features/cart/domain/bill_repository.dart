import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/features/cart/domain/cart_controller.dart';

class BillBreakdown {
  const BillBreakdown({
    required this.itemTotal,
    required this.handlingFee,
    required this.smallCartFee,
    required this.deliveryFee,
    required this.gstAndOtherCharges,
    required this.deliveryPartnerTip,
  });

  final double itemTotal;
  final double handlingFee;
  final double smallCartFee;
  final double deliveryFee;
  final double gstAndOtherCharges;
  final double deliveryPartnerTip;

  double get toPay =>
      itemTotal +
      handlingFee +
      smallCartFee +
      deliveryFee +
      gstAndOtherCharges +
      deliveryPartnerTip;
}

abstract class BillRepository {
  BillBreakdown calculateBill(
    List<CartItem> cartItems, {
    double deliveryPartnerTip = 0,
  });
}

final billRepositoryProvider = Provider<BillRepository>(
  (ref) => MockBillRepository(),
);

class MockBillRepository implements BillRepository {
  const MockBillRepository();

  static const double _smallCartThreshold = 99;
  static const double _freeDeliveryThreshold = 199;

  @override
  BillBreakdown calculateBill(
    List<CartItem> cartItems, {
    double deliveryPartnerTip = 0,
  }) {
    final itemTotal = cartItems.fold<double>(
      0,
      (total, item) => total + item.product.sellingPrice * item.quantity,
    );

    if (cartItems.isEmpty) {
      return const BillBreakdown(
        itemTotal: 0,
        handlingFee: 0,
        smallCartFee: 0,
        deliveryFee: 0,
        gstAndOtherCharges: 0,
        deliveryPartnerTip: 0,
      );
    }

    return BillBreakdown(
      itemTotal: itemTotal,
      handlingFee: 5,
      smallCartFee: itemTotal < _smallCartThreshold ? 15 : 0,
      deliveryFee: itemTotal >= _freeDeliveryThreshold ? 0 : 25,
      gstAndOtherCharges: itemTotal * 0.05,
      deliveryPartnerTip: deliveryPartnerTip < 0 ? 0 : deliveryPartnerTip,
    );
  }
}
