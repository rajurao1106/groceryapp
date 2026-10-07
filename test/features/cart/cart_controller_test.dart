import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:grocery_app/features/cart/domain/cart_controller.dart';
import 'package:grocery_app/features/cart/domain/cart_count_provider.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('cart controller adds, increases, and removes products', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final controller = container.read(cartControllerProvider.notifier);
    const product = HomeProduct(
      id: 'p-101',
      name: 'Apple',
      packSize: '1 kg',
      imageUrl: 'https://example.com/apple.png',
      sellingPrice: 80,
      mrp: 100,
      discountPercent: 20,
      isFavourite: false,
      stock: 5,
    );

    await controller.addProduct(product);
    expect(container.read(cartControllerProvider).length, 1);
    expect(container.read(cartItemCountProvider), 1);

    await controller.increase(product.id);
    expect(container.read(cartControllerProvider).first.quantity, 2);

    await controller.decrease(product.id);
    expect(container.read(cartControllerProvider).first.quantity, 1);

    await controller.remove(product.id);
    expect(container.read(cartControllerProvider), isEmpty);
  });
}
