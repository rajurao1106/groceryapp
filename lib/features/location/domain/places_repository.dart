abstract class PlacesRepository {
  Future<List<PlaceSuggestion>> search(String query);
}

class PlaceSuggestion {
  const PlaceSuggestion({required this.name, this.subtitle});

  final String name;
  final String? subtitle;
}
