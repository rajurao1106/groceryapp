import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/core/widgets/app_text_field.dart';
import 'package:grocery_app/core/widgets/primary_button.dart';
import 'package:grocery_app/features/location/data/mock_places_repository.dart';
import 'package:grocery_app/features/location/domain/places_repository.dart';

final placesRepositoryProvider = Provider<PlacesRepository>(
  (ref) => MockPlacesRepository(),
);

class LocationSelectionScreen extends ConsumerStatefulWidget {
  const LocationSelectionScreen({super.key});

  @override
  ConsumerState<LocationSelectionScreen> createState() =>
      _LocationSelectionScreenState();
}

class _LocationSelectionScreenState
    extends ConsumerState<LocationSelectionScreen> {
  final TextEditingController _manualController = TextEditingController();
  Timer? _debounce;
  List<PlaceSuggestion> _suggestions = const [];
  bool _isSearching = false;
  bool _isLoadingLocation = false;

  @override
  void dispose() {
    _debounce?.cancel();
    _manualController.dispose();
    super.dispose();
  }

  bool _isServiceAreaValid(double lat, double lng) {
    final inBengaluruLat = lat >= 12.75 && lat <= 13.2;
    final inBengaluruLng = lng >= 77.45 && lng <= 77.8;
    return inBengaluruLat && inBengaluruLng;
  }

  Future<void> _handleSearch(String value) async {
    final query = value.trim();
    if (_debounce?.isActive ?? false) {
      _debounce!.cancel();
    }

    if (query.length < 2) {
      setState(() {
        _suggestions = const [];
      });
      return;
    }

    _debounce = Timer(const Duration(milliseconds: 400), () async {
      setState(() => _isSearching = true);
      final results = await ref.read(placesRepositoryProvider).search(query);
      if (!mounted) return;
      setState(() {
        _suggestions = results;
        _isSearching = false;
      });
    });
  }

  Future<void> _useCurrentLocation() async {
    final permissionStatus = await Permission.locationWhenInUse.status;
    if (permissionStatus.isDenied) {
      final requested = await Permission.locationWhenInUse.request();
      if (requested.isDenied || requested.isPermanentlyDenied) {
        if (!mounted) return;
        if (requested.isPermanentlyDenied) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Location permission is permanently denied. Enable it in settings.',
              ),
            ),
          );
          await openAppSettings();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Location permission is required.')),
          );
        }
        return;
      }
    }

    if (permissionStatus.isPermanentlyDenied) {
      await openAppSettings();
      return;
    }

    setState(() => _isLoadingLocation = true);

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );
      final geocoding = Geocoding();
      final placemarks = await geocoding.placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );
      final place = placemarks.first;
      final formattedAddress = [
        place.name,
        place.street,
        place.locality,
        place.subAdministrativeArea,
        place.country,
      ].whereType<String>().where((value) => value.isNotEmpty).join(', ');

      final serviceAreaValid = _isServiceAreaValid(
        position.latitude,
        position.longitude,
      );

      if (!mounted) return;
      context.go(
        '/location-map',
        extra: {
          'address': formattedAddress.isNotEmpty
              ? formattedAddress
              : 'Bengaluru',
          'lat': position.latitude,
          'lng': position.longitude,
          'serviceAreaValid': serviceAreaValid,
        },
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to get your current location: $error')),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  void _openMapForSearch(String value) {
    final query = value.trim();
    if (query.isEmpty) {
      return;
    }

    context.go(
      '/location-map',
      extra: {
        'address': query,
        'lat': 12.9716,
        'lng': 77.5946,
        'serviceAreaValid': true,
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Choose delivery location'),
        leading: const BackButton(),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(
                'Where do you want the groceries delivered?',
                style: Theme.of(context).textTheme.headlineMedium,
              ),
              const SizedBox(height: 28),
              _LocationOptionTile(
                title: 'Use current location',
                subtitle: 'Detect my location automatically',
                icon: Icons.my_location_rounded,
                onTap: _useCurrentLocation,
                isLoading: _isLoadingLocation,
              ),
              const SizedBox(height: 12),
              _LocationOptionTile(
                title: 'Search location manually',
                subtitle: 'Pick a nearby place',
                icon: Icons.search_rounded,
                onTap: () {},
              ),
              const SizedBox(height: 20),
              AppTextField(
                controller: _manualController,
                hintText: 'Search for area or landmark',
                textInputAction: TextInputAction.search,
                onChanged: (value) {
                  _handleSearch(value);
                },
              ),
              const SizedBox(height: 12),
              if (_isSearching)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: CircularProgressIndicator(),
                  ),
                )
              else if (_suggestions.isNotEmpty) ...[
                Text(
                  'Suggestions',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _suggestions.length,
                  separatorBuilder: (context, index) =>
                      const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final place = _suggestions[index];
                    return InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => _openMapForSearch(place.name),
                      child: Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.location_on_outlined,
                              color: AppColors.primaryGreen,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                place.name,
                                style: Theme.of(context).textTheme.bodyLarge,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ],
              const SizedBox(height: 24),
              if (_manualController.text.trim().isNotEmpty &&
                  _suggestions.isEmpty &&
                  !_isSearching)
                Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: PrimaryButton(
                    text: 'Use this place',
                    onPressed: () => _openMapForSearch(_manualController.text),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LocationOptionTile extends StatelessWidget {
  const _LocationOptionTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.isLoading = false,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: AppColors.primaryGreen.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: isLoading
                    ? const Center(
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      )
                    : Icon(icon, color: AppColors.primaryGreen),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 18),
            ],
          ),
        ),
      ),
    );
  }
}
