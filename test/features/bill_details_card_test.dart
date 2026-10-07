import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/cart/domain/bill_repository.dart';
import 'package:grocery_app/features/cart/presentation/bill_details_card.dart';

void main() {
  testWidgets('shows only To Pay until the breakdown is expanded', (
    tester,
  ) async {
    const bill = BillBreakdown(
      itemTotal: 80,
      handlingFee: 5,
      smallCartFee: 15,
      deliveryFee: 25,
      gstAndOtherCharges: 4,
      deliveryPartnerTip: 10,
    );

    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: BillDetailsCard(bill: bill, showDeliveryTip: true),
        ),
      ),
    );

    expect(find.text('To Pay'), findsOneWidget);
    expect(find.text('View breakdown'), findsOneWidget);
    expect(find.text('Item Total'), findsNothing);

    await tester.tap(find.text('View breakdown'));
    await tester.pumpAndSettle();

    expect(find.text('Item Total'), findsOneWidget);
    expect(find.text('Handling Fee'), findsOneWidget);
    expect(find.text('Small Cart Fee'), findsOneWidget);
    expect(find.text('GST and Other Charges'), findsOneWidget);
    expect(find.text('Delivery Partner Tip'), findsOneWidget);
  });
}
