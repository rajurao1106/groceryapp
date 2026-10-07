class AddressFormValidator {
  const AddressFormValidator._();

  static String? validateHouseNumber(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'House/Flat number is required';
    }
    return null;
  }

  static String? validateLandmark(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isNotEmpty && trimmed.length < 3) {
      return 'Landmark should be at least 3 characters';
    }
    return null;
  }

  static String? validateLabel(String? value) {
    final trimmed = value?.trim() ?? '';
    if (trimmed.isEmpty) {
      return 'Please select a label';
    }
    return null;
  }
}
