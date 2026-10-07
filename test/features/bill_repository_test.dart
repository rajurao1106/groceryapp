import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/cart/domain/bill_repository.dart';
import 'package:grocery_app/features/cart/domain/cart_controller.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

void main() {
  const product = HomeProduct(
    id: 'bill-test',
    name: 'Test product',
    packSize: '1 pack',
    imageUrl: '',
    sellingPrice: 80,
    mrp: 100,
    discountPercent: 20,
    isFavourite: false,
    stock: 10,
  );
  const repository = MockBillRepository();

  test('adds small-cart, handling, delivery, and GST charges', () {
    final bill = repository.calculateBill([
      const CartItem(product: product, quantity: 1),
    ]);

    expect(bill.itemTotal, 80);
    expect(bill.handlingFee, 5);
    expect(bill.smallCartFee, 15);
    expect(bill.deliveryFee, 25);
    expect(bill.gstAndOtherCharges, 4);
    expect(bill.toPay, 129);
  });

  test(
    'waives small-cart and delivery fees at thresholds and includes tip',
    () {
      final bill = repository.calculateBill([
        const CartItem(product: product, quantity: 3),
      ], deliveryPartnerTip: 20);

      expect(bill.itemTotal, 240);
      expect(bill.smallCartFee, 0);
      expect(bill.deliveryFee, 0);
      expect(bill.gstAndOtherCharges, 12);
      expect(bill.deliveryPartnerTip, 20);
      expect(bill.toPay, 277);
    },
  );
}
