import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:grocery_app/features/orders/domain/orders_repository.dart';

final ordersRepositoryProvider = Provider<OrdersRepository>(
  (ref) => MockOrdersRepository(),
);

class MockOrdersRepository implements OrdersRepository {
  final List<Order> _createdOrders = [];

  @override
  Future<List<Order>> getOrders() async {
    await Future<void>.delayed(const Duration(milliseconds: 400));
    final now = DateTime.now();

    return [
      ..._createdOrders,
      Order(
        id: 'ORD-1048',
        date: now.subtract(const Duration(days: 2)),
        items: [
          const OrderItem(
            productId: 'p1',
            name: 'Royal Gala Apples',
            packSize: '1 kg',
            quantity: 2,
            price: 189,
            imageUrl:
                'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=800&q=80',
          ),
          const OrderItem(
            productId: 'p6',
            name: 'Amul Milk',
            packSize: '1 L',
            quantity: 1,
            price: 66,
            imageUrl:
                'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=800&q=80',
          ),
        ],
        amount: 444,
        status: OrderStatus.delivered,
        deliveryAddress: '24, Green Park Road, Bengaluru',
        timeline: [
          OrderTimelineEntry(
            title: 'Order placed',
            subtitle: 'We received your order.',
            date: now.subtract(const Duration(days: 2, hours: 1)),
          ),
          OrderTimelineEntry(
            title: 'Packed',
            subtitle: 'Your groceries are being packed.',
            date: now.subtract(const Duration(days: 1, hours: 7)),
          ),
          OrderTimelineEntry(
            title: 'Delivered',
            subtitle: 'Delivered to your doorstep.',
            date: now.subtract(const Duration(days: 1)),
          ),
        ],
      ),
      Order(
        id: 'ORD-1035',
        date: now.subtract(const Duration(days: 7)),
        items: [
          const OrderItem(
            productId: 'p3',
            name: 'Farm Fresh Spinach',
            packSize: '250 g',
            quantity: 3,
            price: 59,
            imageUrl:
                'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=80',
          ),
        ],
        amount: 177,
        status: OrderStatus.delivered,
        deliveryAddress: '12, 7th Cross, Indiranagar, Bengaluru',
        timeline: [
          OrderTimelineEntry(
            title: 'Order placed',
            subtitle: 'We received your order.',
            date: now.subtract(const Duration(days: 7, hours: 3)),
          ),
          OrderTimelineEntry(
            title: 'Delivered',
            subtitle: 'Completed successfully.',
            date: now.subtract(const Duration(days: 6, hours: 4)),
          ),
        ],
      ),
      Order(
        id: 'ORD-1021',
        date: now.subtract(const Duration(days: 15)),
        items: [
          const OrderItem(
            productId: 'p11',
            name: 'Cucumber',
            packSize: '500 g',
            quantity: 2,
            price: 39,
            imageUrl:
                'https://images.unsplash.com/photo-1449300079323-02e209d1d3f5?auto=format&fit=crop&w=800&q=80',
          ),
          const OrderItem(
            productId: 'p8',
            name: 'Orange Juice',
            packSize: '1 L',
            quantity: 1,
            price: 110,
            imageUrl:
                'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=800&q=80',
          ),
        ],
        amount: 188,
        status: OrderStatus.cancelled,
        deliveryAddress: '22, HSR Layout, Bengaluru',
        timeline: [
          OrderTimelineEntry(
            title: 'Order placed',
            subtitle: 'We received your order.',
            date: now.subtract(const Duration(days: 15, hours: 2)),
          ),
          OrderTimelineEntry(
            title: 'Cancelled',
            subtitle: 'Order was cancelled by the customer.',
            date: now.subtract(const Duration(days: 14, hours: 5)),
          ),
        ],
      ),
      Order(
        id: 'ORD-1012',
        date: now.subtract(const Duration(days: 21)),
        items: [
          const OrderItem(
            productId: 'p5',
            name: 'Whole Wheat Bread',
            packSize: '400 g',
            quantity: 2,
            price: 75,
            imageUrl:
                'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
          ),
          const OrderItem(
            productId: 'p9',
            name: 'Mini Cookies',
            packSize: '150 g',
            quantity: 1,
            price: 89,
            imageUrl:
                'https://images.unsplash.com/photo-1499636136210-6d847e70c0f7?auto=format&fit=crop&w=800&q=80',
          ),
        ],
        amount: 239,
        status: OrderStatus.inTransit,
        deliveryAddress: '14, Koramangala 5th Block, Bengaluru',
        timeline: [
          OrderTimelineEntry(
            title: 'Order placed',
            subtitle: 'Preparing your order.',
            date: now.subtract(const Duration(days: 21, hours: 2)),
          ),
          OrderTimelineEntry(
            title: 'On the way',
            subtitle: 'Delivery partner is en route.',
            date: now.subtract(const Duration(days: 20, hours: 9)),
          ),
        ],
      ),
      Order(
        id: 'ORD-1006',
        date: now.subtract(const Duration(days: 30)),
        items: [
          const OrderItem(
            productId: 'p2',
            name: 'Avocado',
            packSize: '2 pcs',
            quantity: 1,
            price: 149,
            imageUrl:
                'https://images.unsplash.com/photo-1519162808019-7de1683fa2ad?auto=format&fit=crop&w=800&q=80',
          ),
          const OrderItem(
            productId: 'p10',
            name: 'Fruit Yogurt',
            packSize: '200 g',
            quantity: 2,
            price: 79,
            imageUrl:
                'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80',
          ),
        ],
        amount: 307,
        status: OrderStatus.pending,
        deliveryAddress: '89, Whitefield, Bengaluru',
        timeline: [
          OrderTimelineEntry(
            title: 'Order placed',
            subtitle: 'Awaiting confirmation.',
            date: now.subtract(const Duration(days: 30, hours: 4)),
          ),
        ],
      ),
    ];
  }

  @override
  Future<Order?> getOrderById(String id) async {
    final orders = await getOrders();
    for (final order in orders) {
      if (order.id == id) {
        return order;
      }
    }
    return null;
  }

  @override
  Future<void> addOrder(Order order) async {
    _createdOrders.insert(0, order);
  }
}
