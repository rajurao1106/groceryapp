import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/auth/presentation/auth_controller.dart';
import 'package:grocery_app/features/cart/domain/bill_repository.dart';
import 'package:grocery_app/features/cart/domain/cart_controller.dart';
import 'package:grocery_app/features/cart/presentation/bill_details_card.dart';
import 'package:grocery_app/features/checkout/domain/payment_repository.dart';
import 'package:grocery_app/features/location/domain/address_repository.dart';
import 'package:grocery_app/features/location/presentation/selected_address_provider.dart';
import 'package:grocery_app/features/orders/data/mock_orders_repository.dart';
import 'package:grocery_app/features/orders/domain/orders_repository.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';

String get _razorpayKey => dotenv.env['rzp_test_TZvgFQIy5qGWLB'] ?? '';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  late final Razorpay _razorpay;
  final TextEditingController _instructionsController = TextEditingController();
  double _tip = 0;
  bool _isPaying = false;
  String? _razorpayOrderId;
  List<CartItem> _pendingItems = const [];
  double _pendingAmount = 0;
  String _pendingAddress = '';

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    _instructionsController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartControllerProvider);
    final address = ref.watch(selectedAddressProvider);
    final bill = ref
        .watch(billRepositoryProvider)
        .calculateBill(cart, deliveryPartnerTip: _tip);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        title: const Text('Checkout'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
        children: [
          _SectionTitle(title: 'Delivery address', action: _changeAddress),
          const SizedBox(height: 10),
          _AddressCard(address: address, onChange: _changeAddress),
          const SizedBox(height: 22),
          const _SectionTitle(title: 'Delivery instructions'),
          const SizedBox(height: 10),
          TextField(
            controller: _instructionsController,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: 'Leave at door',
              filled: true,
              fillColor: AppColors.surface,
              prefixIcon: const Icon(Icons.edit_note_outlined),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppColors.border),
              ),
            ),
          ),
          const SizedBox(height: 22),
          const _SectionTitle(title: 'Tip your delivery partner'),
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _tipChip('No tip', 0),
              _tipChip('₹10', 10),
              _tipChip('₹20', 20),
              _tipChip('₹30', 30),
              ChoiceChip(
                label: Text(
                  _isCustomTip ? '₹${_tip.toStringAsFixed(0)}' : 'Custom',
                ),
                selected: _isCustomTip,
                onSelected: (_) => _selectCustomTip(),
                selectedColor: AppColors.primaryGreen.withValues(alpha: 0.14),
                side: BorderSide(
                  color: _isCustomTip
                      ? AppColors.primaryGreen
                      : AppColors.border,
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          BillDetailsCard(bill: bill, showDeliveryTip: true),
          const SizedBox(height: 22),
          const _SectionTitle(title: 'Payment method'),
          const SizedBox(height: 10),
          const _RazorpayMethodTile(),
        ],
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
          child: SizedBox(
            height: 52,
            child: FilledButton(
              onPressed: _isPaying || cart.isEmpty || address == null
                  ? null
                  : _proceedToPay,
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                disabledBackgroundColor: AppColors.surfaceVariant,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isPaying
                  ? const SizedBox.square(
                      dimension: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      'Proceed to Pay  ₹${bill.toPay.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  bool get _isCustomTip => _tip > 0 && _tip != 10 && _tip != 20 && _tip != 30;

  Widget _tipChip(String label, double amount) {
    final selected = _tip == amount;
    return ChoiceChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => setState(() => _tip = amount),
      selectedColor: AppColors.primaryGreen.withValues(alpha: 0.14),
      side: BorderSide(
        color: selected ? AppColors.primaryGreen : AppColors.border,
      ),
      labelStyle: TextStyle(
        color: selected ? AppColors.primaryGreen : AppColors.textPrimary,
        fontWeight: FontWeight.w700,
      ),
    );
  }

  Future<void> _selectCustomTip() async {
    final controller = TextEditingController(
      text: _isCustomTip ? _tip.toStringAsFixed(0) : '',
    );
    final amount = await showDialog<double>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Custom tip'),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(
            prefixText: '₹ ',
            hintText: 'Enter amount',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final parsed = double.tryParse(controller.text.trim());
              if (parsed != null && parsed >= 0) {
                Navigator.pop(dialogContext, parsed);
              }
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
    controller.dispose();
    if (amount != null && mounted) {
      setState(() => _tip = amount);
    }
  }

  void _changeAddress() {
    context.push('/location');
  }

  Future<void> _proceedToPay() async {
    if (_isPaying) {
      return;
    }
    final items = List<CartItem>.from(ref.read(cartControllerProvider));
    final address = ref.read(selectedAddressProvider);
    if (items.isEmpty || address == null) {
      return;
    }

    final bill = ref
        .read(billRepositoryProvider)
        .calculateBill(items, deliveryPartnerTip: _tip);
    setState(() => _isPaying = true);

    try {
      final razorpayOrderId = await ref
          .read(paymentRepositoryProvider)
          .createOrder(bill.toPay);
      _razorpayOrderId = razorpayOrderId;
      _pendingItems = items;
      _pendingAmount = bill.toPay;
      _pendingAddress = address.fullAddress;

      if (!mounted) {
        return;
      }
      if (_razorpayKey.isEmpty) {
        setState(() => _isPaying = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Add a Razorpay test key with --dart-define=RAZORPAY_KEY=... to continue.',
            ),
          ),
        );
        return;
      }

      final mobile = ref.read(authControllerProvider).mobile ?? '';
      _razorpay.open({
        'key': _razorpayKey,
        'amount': (bill.toPay * 100).round(),
        'currency': 'INR',
        'name': 'Grocery App',
        'order_id': razorpayOrderId,
        'prefill': {'contact': mobile},
      });
    } catch (error) {
      if (mounted) {
        setState(() => _isPaying = false);
        _showPaymentFailure(error.toString());
      }
    }
  }

  void _onPaymentSuccess(PaymentSuccessResponse response) {
    unawaited(_completePayment(response));
  }

  Future<void> _completePayment(PaymentSuccessResponse response) async {
    final orderId = _razorpayOrderId;
    if (orderId == null) {
      return;
    }
    try {
      final verified = await ref
          .read(paymentRepositoryProvider)
          .verifyPayment(
            orderId: response.orderId ?? orderId,
            paymentId: response.paymentId ?? '',
            signature: response.signature ?? '',
          );
      if (!verified) {
        _showPaymentFailure('Payment verification failed. Please retry.');
        return;
      }

      final appOrderId = 'ORD-${DateTime.now().millisecondsSinceEpoch}';
      final now = DateTime.now();
      final order = Order(
        id: appOrderId,
        date: now,
        items: _pendingItems
            .map(
              (item) => OrderItem(
                productId: item.product.id,
                name: item.product.name,
                packSize: item.product.packSize,
                quantity: item.quantity,
                price: item.product.sellingPrice,
                imageUrl: item.product.imageUrl,
              ),
            )
            .toList(),
        amount: _pendingAmount,
        status: OrderStatus.pending,
        deliveryAddress: _pendingAddress,
        timeline: [
          OrderTimelineEntry(
            title: 'Order placed',
            subtitle: 'Payment received. We are preparing your order.',
            date: now,
          ),
        ],
      );
      await ref.read(ordersRepositoryProvider).addOrder(order);
      await ref.read(cartControllerProvider.notifier).clear();
      if (mounted) {
        context.go('/order-confirmation/$appOrderId');
      }
    } catch (error) {
      if (mounted) {
        _showPaymentFailure(error.toString());
      }
    }
  }

  void _onPaymentError(PaymentFailureResponse response) {
    _showPaymentFailure(response.message ?? 'Payment failed. Please retry.');
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'External wallet selected: ${response.walletName ?? 'Wallet'}',
        ),
      ),
    );
    if (mounted) {
      setState(() => _isPaying = false);
    }
  }

  void _showPaymentFailure(String reason) {
    if (!mounted) {
      return;
    }
    setState(() => _isPaying = false);
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 42,
                color: AppColors.error,
              ),
              const SizedBox(height: 12),
              const Text(
                'Payment unsuccessful',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 8),
              Text(reason, textAlign: TextAlign.center),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () {
                    Navigator.pop(sheetContext);
                    _proceedToPay();
                  },
                  child: const Text('Try again'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, this.action});

  final String title;
  final VoidCallback? action;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          ),
        ),
        if (action != null)
          TextButton(onPressed: action, child: const Text('Change')),
      ],
    );
  }
}

class _AddressCard extends StatelessWidget {
  const _AddressCard({required this.address, required this.onChange});

  final Address? address;
  final VoidCallback onChange;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          const Icon(Icons.location_on_outlined, color: AppColors.primaryGreen),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  address?.label ?? 'Delivery address',
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                const SizedBox(height: 4),
                Text(
                  address?.fullAddress ?? 'Choose an address to continue',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
          TextButton(onPressed: onChange, child: const Text('Change')),
        ],
      ),
    );
  }
}

class _RazorpayMethodTile extends StatelessWidget {
  const _RazorpayMethodTile();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: const ListTile(
        leading: Icon(Icons.account_balance_wallet_outlined),
        title: Text(
          'Pay via Razorpay',
          style: TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text('UPI / Cards / Wallets'),
        trailing: Icon(Icons.arrow_forward_ios_rounded, size: 16),
      ),
    );
  }
}
