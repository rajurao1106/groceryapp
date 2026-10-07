import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:grocery_app/features/profile/domain/profile_repository.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  SharedPreferences.setMockInitialValues({});

  test('profile repository stores and returns profile values', () async {
    final repo = MockProfileRepository();
    const profile = ProfileUser(
      name: 'Aisha Kumar',
      phone: '+91 98765 43210',
      email: 'aisha@example.com',
      photoUrl: null,
    );

    await repo.saveProfile(profile);
    final saved = await repo.getProfile();

    expect(saved.name, 'Aisha Kumar');
    expect(saved.phone, '+91 98765 43210');
    expect(saved.email, 'aisha@example.com');
  });
}
