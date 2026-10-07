abstract class DeviceRepository {
  Future<void> registerToken(String token);
}

class MockDeviceRepository implements DeviceRepository {
  @override
  Future<void> registerToken(String token) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    // TODO: replace with real backend call once Firebase is configured.
  }
}
