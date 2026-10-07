import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:grocery_app/features/wishlist/presentation/wishlist_controller.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  test('wishlist controller toggles product ids and saves state', () async {
    final container = ProviderContainer();
    addTearDown(container.dispose);

    final controller = container.read(wishlistControllerProvider.notifier);
    await controller.load();

    await controller.toggle('p-101');
    expect(
      container.read(wishlistControllerProvider).contains('p-101'),
      isTrue,
    );

    await controller.toggle('p-101');
    expect(
      container.read(wishlistControllerProvider).contains('p-101'),
      isFalse,
    );
  });
}
