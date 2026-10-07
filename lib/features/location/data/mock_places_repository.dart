import 'package:grocery_app/features/location/domain/places_repository.dart';

class MockPlacesRepository implements PlacesRepository {
  @override
  Future<List<PlaceSuggestion>> search(String query) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));

    if (query.trim().isEmpty) {
      return const [];
    }

    final places = [
      'Indiranagar, Bengaluru',
      'Koramangala, Bengaluru',
      'HSR Layout, Bengaluru',
      'Jayanagar, Bengaluru',
      'Whitefield, Bengaluru',
      'Electronic City, Bengaluru',
      'Malleshwaram, Bengaluru',
      'Bellandur, Bengaluru',
      'Domlur, Bengaluru',
      'Kalyan Nagar, Bengaluru',
    ];

    final normalized = query.toLowerCase();
    return places
        .where((place) => place.toLowerCase().contains(normalized))
        .map((place) => PlaceSuggestion(name: place))
        .toList();
  }
}
