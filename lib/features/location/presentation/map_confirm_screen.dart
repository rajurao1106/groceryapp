import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/core/widgets/primary_button.dart';
import 'package:grocery_app/features/location/domain/address_repository.dart';
import 'package:grocery_app/features/location/domain/location_validators.dart';
import 'package:grocery_app/features/location/presentation/selected_address_provider.dart';

class MapConfirmScreen extends ConsumerStatefulWidget {
  const MapConfirmScreen({
    super.key,
    required this.address,
    required this.latitude,
    required this.longitude,
  });

  final String address;
  final double latitude;
  final double longitude;

  @override
  ConsumerState<MapConfirmScreen> createState() => _MapConfirmScreenState();
}

class _MapConfirmScreenState extends ConsumerState<MapConfirmScreen> {
  late CameraPosition _cameraPosition;
  LatLng _selectedLatLng = const LatLng(12.9716, 77.5946);
  final TextEditingController _houseController = TextEditingController();
  final TextEditingController _landmarkController = TextEditingController();
  String _selectedLabel = 'Home';
  bool _isSaving = false;
  bool _isServiceAreaValid = true;

  @override
  void initState() {
    super.initState();
    _selectedLatLng = LatLng(widget.latitude, widget.longitude);
    _cameraPosition = CameraPosition(target: _selectedLatLng, zoom: 15);
    final isWithinBengaluru =
        widget.latitude >= 12.75 &&
        widget.latitude <= 13.2 &&
        widget.longitude >= 77.45 &&
        widget.longitude <= 77.8;
    _isServiceAreaValid = isWithinBengaluru;
  }

  @override
  void dispose() {
    _houseController.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  Future<void> _saveAddress() async {
    final houseError = AddressFormValidator.validateHouseNumber(
      _houseController.text,
    );
    final labelError = AddressFormValidator.validateLabel(_selectedLabel);
    if (houseError != null || labelError != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(houseError ?? labelError ?? 'Please complete the form'),
        ),
      );
      return;
    }

    final address = Address(
      id: DateTime.now().microsecondsSinceEpoch.toString(),
      fullAddress: widget.address,
      label: _selectedLabel,
      houseNumber: _houseController.text.trim(),
      landmark: _landmarkController.text.trim().isEmpty
          ? null
          : _landmarkController.text.trim(),
      latitude: _selectedLatLng.latitude,
      longitude: _selectedLatLng.longitude,
      isDefault: true,
      serviceAreaValid: _isServiceAreaValid,
    );

    setState(() => _isSaving = true);
    await ref.read(selectedAddressProvider.notifier).save(address);
    if (!mounted) return;
    setState(() => _isSaving = false);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Confirm location')),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: Stack(
                children: [
                  GoogleMap(
                    initialCameraPosition: _cameraPosition,
                    onMapCreated: (_) {},
                    onCameraMove: (cameraPosition) =>
                        _selectedLatLng = cameraPosition.target,
                    myLocationEnabled: true,
                    myLocationButtonEnabled: false,
                    zoomControlsEnabled: false,
                    markers: {
                      Marker(
                        markerId: const MarkerId('selected-location'),
                        position: _selectedLatLng,
                      ),
                    },
                  ),
                  Positioned(
                    left: 16,
                    right: 16,
                    bottom: 18,
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 18,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_rounded,
                                color: AppColors.primaryGreen,
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  widget.address,
                                  style: Theme.of(
                                    context,
                                  ).textTheme.titleMedium,
                                ),
                              ),
                            ],
                          ),
                          if (!_isServiceAreaValid) ...[
                            const SizedBox(height: 12),
                            const Text(
                              'We don\'t deliver here yet',
                              style: TextStyle(
                                color: AppColors.error,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                          const SizedBox(height: 16),
                          TextField(
                            controller: _houseController,
                            decoration: const InputDecoration(
                              hintText: 'House / Flat no.',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextField(
                            controller: _landmarkController,
                            decoration: const InputDecoration(
                              hintText: 'Landmark (optional)',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: ['Home', 'Work', 'Other'].map((label) {
                              final selected = _selectedLabel == label;
                              return ChoiceChip(
                                label: Text(label),
                                selected: selected,
                                onSelected: (_) =>
                                    setState(() => _selectedLabel = label),
                                selectedColor: AppColors.primaryGreen
                                    .withValues(alpha: 0.12),
                                labelStyle: TextStyle(
                                  color: selected
                                      ? AppColors.primaryGreen
                                      : AppColors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 16),
                          PrimaryButton(
                            text: _isSaving ? 'Saving...' : 'Confirm location',
                            isLoading: _isSaving,
                            isEnabled: _isServiceAreaValid,
                            onPressed: _saveAddress,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
