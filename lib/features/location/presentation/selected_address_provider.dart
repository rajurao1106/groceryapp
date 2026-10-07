import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/features/location/data/mock_address_repository.dart';
import 'package:grocery_app/features/location/domain/address_repository.dart';

final addressRepositoryProvider = Provider<AddressRepository>(
  (ref) => MockAddressRepository(),
);

final selectedAddressProvider =
    NotifierProvider<SelectedAddressController, Address?>(() {
      return SelectedAddressController();
    });

class SelectedAddressController extends Notifier<Address?> {
  AddressRepository get _repository => ref.read(addressRepositoryProvider);

  @override
  Address? build() {
    _loadDefault();
    return null;
  }

  Future<void> _loadDefault() async {
    final addresses = await _repository.getSavedAddresses();
    final defaultAddress = addresses.where((item) => item.isDefault).isNotEmpty
        ? addresses.firstWhere((item) => item.isDefault)
        : null;
    state = defaultAddress ?? (addresses.isNotEmpty ? addresses.first : null);
  }

  Future<void> save(Address address) async {
    await _repository.saveAddress(address);
    final addresses = await _repository.getSavedAddresses();
    final defaultMatch = addresses.where((item) => item.isDefault);
    state = defaultMatch.isNotEmpty
        ? defaultMatch.first
        : (addresses.isNotEmpty ? addresses.first : address);
  }

  Future<void> clear() async {
    state = null;
  }
}
