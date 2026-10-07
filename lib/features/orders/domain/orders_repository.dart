import 'package:flutter/material.dart';

abstract class OrdersRepository {
  Future<List<Order>> getOrders();
  Future<Order?> getOrderById(String id);
  Future<void> addOrder(Order order);
}

enum OrderStatus { delivered, inTransit, cancelled, pending }

class Order {
  const Order({
    required this.id,
    required this.date,
    required this.items,
    required this.amount,
    required this.status,
    required this.deliveryAddress,
    required this.timeline,
  });

  final String id;
  final DateTime date;
  final List<OrderItem> items;
  final double amount;
  final OrderStatus status;
  final String deliveryAddress;
  final List<OrderTimelineEntry> timeline;
}

class OrderItem {
  const OrderItem({
    required this.productId,
    required this.name,
    required this.packSize,
    required this.quantity,
    required this.price,
    required this.imageUrl,
  });

  final String productId;
  final String name;
  final String packSize;
  final int quantity;
  final double price;
  final String imageUrl;

  double get total => price * quantity;
}

class OrderTimelineEntry {
  const OrderTimelineEntry({
    required this.title,
    required this.subtitle,
    required this.date,
  });

  final String title;
  final String subtitle;
  final DateTime? date;
}

class OrderBillSummary {
  const OrderBillSummary({
    required this.itemTotal,
    required this.deliveryFee,
    required this.discount,
    required this.grandTotal,
  });

  final double itemTotal;
  final double deliveryFee;
  final double discount;
  final double grandTotal;
}

extension OrderStatusLabel on OrderStatus {
  String get label {
    switch (this) {
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.inTransit:
        return 'In transit';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.pending:
        return 'Pending';
    }
  }
}

extension OrderStatusColor on OrderStatus {
  Color get color {
    switch (this) {
      case OrderStatus.delivered:
        return const Color(0xFF22A45D);
      case OrderStatus.inTransit:
        return const Color(0xFFFFA726);
      case OrderStatus.cancelled:
        return const Color(0xFFE05252);
      case OrderStatus.pending:
        return const Color(0xFF5C6470);
    }
  }
}
