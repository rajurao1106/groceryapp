import 'package:flutter_test/flutter_test.dart';
import 'package:grocery_app/features/location/domain/location_validators.dart';

void main() {
  group('AddressFormValidator', () {
    test('accepts valid flat number', () {
      expect(AddressFormValidator.validateHouseNumber('A-204'), isNull);
    });

    test('rejects empty flat number', () {
      expect(
        AddressFormValidator.validateHouseNumber('   '),
        'House/Flat number is required',
      );
    });

    test('accepts landmark when provided', () {
      expect(AddressFormValidator.validateLandmark('Near metro gate'), isNull);
    });

    test('requires label selection', () {
      expect(AddressFormValidator.validateLabel(''), 'Please select a label');
    });
  });
}
