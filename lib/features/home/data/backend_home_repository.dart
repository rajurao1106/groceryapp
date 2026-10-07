import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/core/network/api_client.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

final homeRepositoryProvider = Provider<HomeRepository>(
  (ref) => BackendHomeRepository(ref.watch(apiClientProvider)),
);

final homePageProvider = FutureProvider<HomePageData>((ref) async {
  return ref.watch(homeRepositoryProvider).getHomePage();
});

class BackendHomeRepository implements HomeRepository {
  const BackendHomeRepository(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<HomePageData> getHomePage() async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>('/home');
    final data = response.data;
    if (data == null) {
      throw const FormatException('The backend returned an empty home catalog.');
    }
    return HomePageData.fromJson(data);
  }
}
