import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:grocery_app/features/home/data/mock_home_repository.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';

abstract class WishlistRepository {
  Future<List<HomeProduct>> getWishlistProducts(List<String> ids);
}

class MockWishlistRepository implements WishlistRepository {
  MockWishlistRepository(this._homeRepository);

  final HomeRepository _homeRepository;

  @override
  Future<List<HomeProduct>> getWishlistProducts(List<String> ids) async {
    final page = await _homeRepository.getHomePage();
    final allProducts = <HomeProduct>[];

    for (final section in page.sections) {
      allProducts.addAll(section.products);
    }

    return allProducts.where((product) => ids.contains(product.id)).toList();
  }
}

final wishlistRepositoryProvider = Provider<WishlistRepository>(
  (ref) => MockWishlistRepository(ref.read(homeRepositoryProvider)),
);
