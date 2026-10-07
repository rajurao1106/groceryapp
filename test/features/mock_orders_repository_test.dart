import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/orders/data/mock_orders_repository.dart';
import 'package:grocery_app/features/orders/domain/orders_repository.dart';

void main() {
  test(
    'newly added orders are returned in history and detail lookup',
    () async {
      final repository = MockOrdersRepository();
      final order = Order(
        id: 'ORD-test-checkout',
        date: DateTime(2026),
        items: const [],
        amount: 123.45,
        status: OrderStatus.pending,
        deliveryAddress: '10 Market Street',
        timeline: const [],
      );

      await repository.addOrder(order);
      final orders = await repository.getOrders();
      final loadedOrder = await repository.getOrderById(order.id);

      expect(orders.first.id, order.id);
      expect(loadedOrder?.amount, 123.45);
    },
  );
}
