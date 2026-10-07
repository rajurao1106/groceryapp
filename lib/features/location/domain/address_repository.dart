import 'dart:convert';

abstract class AddressRepository {
  Future<List<Address>> getSavedAddresses();
  Future<void> saveAddress(Address address);
  Future<void> deleteAddress(String id);
  Future<void> setDefaultAddress(String id);
}

class Address {
  const Address({
    required this.id,
    required this.fullAddress,
    required this.label,
    required this.latitude,
    required this.longitude,
    this.landmark,
    this.isDefault = false,
    this.houseNumber,
    this.serviceAreaValid = true,
  });

  final String id;
  final String fullAddress;
  final String label;
  final String? landmark;
  final String? houseNumber;
  final double latitude;
  final double longitude;
  final bool isDefault;
  final bool serviceAreaValid;

  Address copyWith({
    String? id,
    String? fullAddress,
    String? label,
    String? landmark,
    String? houseNumber,
    double? latitude,
    double? longitude,
    bool? isDefault,
    bool? serviceAreaValid,
  }) {
    return Address(
      id: id ?? this.id,
      fullAddress: fullAddress ?? this.fullAddress,
      label: label ?? this.label,
      landmark: landmark ?? this.landmark,
      houseNumber: houseNumber ?? this.houseNumber,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      isDefault: isDefault ?? this.isDefault,
      serviceAreaValid: serviceAreaValid ?? this.serviceAreaValid,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'fullAddress': fullAddress,
      'label': label,
      'landmark': landmark,
      'houseNumber': houseNumber,
      'latitude': latitude,
      'longitude': longitude,
      'isDefault': isDefault,
      'serviceAreaValid': serviceAreaValid,
    };
  }

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id:
          json['id'] as String? ??
          DateTime.now().microsecondsSinceEpoch.toString(),
      fullAddress: json['fullAddress'] as String? ?? '',
      label: json['label'] as String? ?? 'Home',
      landmark: json['landmark'] as String?,
      houseNumber: json['houseNumber'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      isDefault: json['isDefault'] as bool? ?? false,
      serviceAreaValid: json['serviceAreaValid'] as bool? ?? true,
    );
  }
}

String addressToJsonList(List<Address> addresses) =>
    jsonEncode(addresses.map((address) => address.toJson()).toList());
