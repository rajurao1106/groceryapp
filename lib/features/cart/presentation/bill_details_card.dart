import 'package:flutter/material.dart';
import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/cart/domain/bill_repository.dart';

class BillDetailsCard extends StatelessWidget {
  const BillDetailsCard({
    required this.bill,
    this.showDeliveryTip = false,
    super.key,
  });

  final BillBreakdown bill;
  final bool showDeliveryTip;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Bill details',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            ExpansionTile(
              key: const PageStorageKey<String>('bill-breakdown'),
              tilePadding: EdgeInsets.zero,
              childrenPadding: const EdgeInsets.only(bottom: 12),
              title: _BillRow(
                label: 'To Pay',
                amount: bill.toPay,
                isTotal: true,
              ),
              subtitle: const Text('View breakdown'),
              children: [
                _BillRow(label: 'Item Total', amount: bill.itemTotal),
                _BillRow(label: 'Handling Fee', amount: bill.handlingFee),
                if (bill.smallCartFee > 0)
                  _BillRow(label: 'Small Cart Fee', amount: bill.smallCartFee),
                _BillRow(label: 'Delivery Fee', amount: bill.deliveryFee),
                _BillRow(
                  label: 'GST and Other Charges',
                  amount: bill.gstAndOtherCharges,
                ),
                if (showDeliveryTip)
                  _BillRow(
                    label: 'Delivery Partner Tip',
                    amount: bill.deliveryPartnerTip,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _BillRow extends StatelessWidget {
  const _BillRow({
    required this.label,
    required this.amount,
    this.isTotal = false,
  });

  final String label;
  final double amount;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: isTotal
                    ? AppColors.textPrimary
                    : AppColors.textSecondary,
                fontSize: isTotal ? 15 : 13,
                fontWeight: isTotal ? FontWeight.w800 : FontWeight.w500,
              ),
            ),
          ),
          Text(
            '₹${amount.toStringAsFixed(2)}',
            style: TextStyle(
              color: isTotal ? AppColors.primaryGreen : AppColors.textPrimary,
              fontSize: isTotal ? 17 : 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}
