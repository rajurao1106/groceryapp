import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:grocery_app/features/location/domain/address_repository.dart';

class MockAddressRepository implements AddressRepository {
  static const String _key = 'saved_addresses';

  @override
  Future<List<Address>> getSavedAddresses() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      return const [];
    }

    final decoded = jsonDecode(raw) as List<dynamic>;
    return decoded
        .map((item) => Address.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<void> saveAddress(Address address) async {
    final prefs = await SharedPreferences.getInstance();
    final current = await getSavedAddresses();
    final list = [...current];

    final index = list.indexWhere((item) => item.id == address.id);
    if (index >= 0) {
      list[index] = address;
    } else {
      list.add(address);
    }

    await prefs.setString(_key, addressToJsonList(list));
  }

  @override
  Future<void> deleteAddress(String id) async {
    final prefs = await SharedPreferences.getInstance();
    final current = await getSavedAddresses();
    final updated = current.where((item) => item.id != id).toList();
    await prefs.setString(_key, addressToJsonList(updated));
  }

  @override
  Future<void> setDefaultAddress(String id) async {
    final current = await getSavedAddresses();
    final updated = current
        .map((item) => item.copyWith(isDefault: item.id == id))
        .toList();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, addressToJsonList(updated));
  }
}
