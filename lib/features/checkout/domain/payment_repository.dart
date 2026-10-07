import 'package:flutter_riverpod/flutter_riverpod.dart';

abstract class PaymentRepository {
  Future<String> createOrder(double amount);

  Future<bool> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  });
}

final paymentRepositoryProvider = Provider<PaymentRepository>(
  (ref) => MockPaymentRepository(),
);

class MockPaymentRepository implements PaymentRepository {
  @override
  Future<String> createOrder(double amount) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    if (amount <= 0) {
      throw ArgumentError.value(amount, 'amount', 'Must be greater than zero');
    }
    return 'order_mock_${DateTime.now().microsecondsSinceEpoch}';
  }

  @override
  Future<bool> verifyPayment({
    required String orderId,
    required String paymentId,
    required String signature,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 100));
    return orderId.isNotEmpty && paymentId.isNotEmpty;
  }
}
