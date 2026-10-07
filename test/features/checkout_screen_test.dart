import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/cart/domain/cart_controller.dart';
import 'package:grocery_app/features/checkout/presentation/checkout_screen.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/location/domain/address_repository.dart';
import 'package:grocery_app/features/location/presentation/selected_address_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('selected tip updates the checkout payable amount', (
    tester,
  ) async {
    const product = HomeProduct(
      id: 'checkout-test',
      name: 'Test apples',
      packSize: '1 kg',
      imageUrl: '',
      sellingPrice: 80,
      mrp: 100,
      discountPercent: 20,
      isFavourite: false,
      stock: 5,
    );
    const address = Address(
      id: 'address-test',
      fullAddress: '10 Market Street, Bengaluru',
      label: 'Home',
      latitude: 12.9,
      longitude: 77.6,
    );
    const channel = MethodChannel('razorpay_flutter');
    final messenger =
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger;
    messenger.setMockMethodCallHandler(channel, (call) async => null);
    addTearDown(() => messenger.setMockMethodCallHandler(channel, null));

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          cartControllerProvider.overrideWith(
            () => _FixedCartController([
              const CartItem(product: product, quantity: 1),
            ]),
          ),
          selectedAddressProvider.overrideWith(
            () => _FixedAddressController(address),
          ),
        ],
        child: const MaterialApp(home: CheckoutScreen()),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('10 Market Street, Bengaluru'), findsOneWidget);
    expect(find.textContaining('₹129.00'), findsNWidgets(2));

    await tester.tap(find.text('₹10'));
    await tester.pumpAndSettle();

    expect(find.textContaining('₹139.00'), findsNWidgets(2));
    expect(find.text('Delivery Partner Tip'), findsNothing);
  });
}

class _FixedCartController extends CartController {
  _FixedCartController(this.items);

  final List<CartItem> items;

  @override
  List<CartItem> build() => items;
}

class _FixedAddressController extends SelectedAddressController {
  _FixedAddressController(this.address);

  final Address address;

  @override
  Address? build() => address;
}
