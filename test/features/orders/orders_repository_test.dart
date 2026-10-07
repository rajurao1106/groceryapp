import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/orders/data/mock_orders_repository.dart';
import 'package:grocery_app/features/orders/domain/orders_repository.dart';

void main() {
  test(
    'orders repository returns mock orders with delivered and cancelled states',
    () async {
      final repository = MockOrdersRepository();
      final orders = await repository.getOrders();

      expect(orders.length, greaterThanOrEqualTo(5));
      expect(
        orders.any((order) => order.status == OrderStatus.delivered),
        isTrue,
      );
      expect(
        orders.any((order) => order.status == OrderStatus.cancelled),
        isTrue,
      );
    },
  );
}
