import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/core/storage/app_preferences.dart';
import 'package:grocery_app/core/storage/secure_token_store.dart';
import 'package:grocery_app/features/location/domain/address_repository.dart';
import 'package:grocery_app/features/location/presentation/selected_address_provider.dart';

class SavedAddressesScreen extends ConsumerWidget {
  const SavedAddressesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final addressesFuture = ref
        .read(addressRepositoryProvider)
        .getSavedAddresses();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Saved Addresses'),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddressEditor(context, ref, null),
        backgroundColor: AppColors.primaryGreen,
        child: const Icon(Icons.add_rounded),
      ),
      body: FutureBuilder<List<Address>>(
        future: addressesFuture,
        builder: (context, snapshot) {
          final addresses = snapshot.data ?? const [];
          if (addresses.isEmpty) {
            return const Center(child: Text('No saved addresses yet'));
          }

          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: addresses.length,
            separatorBuilder: (_, _) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final address = addresses[index];
              return Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            address.label,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        if (address.isDefault)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryGreen.withValues(
                                alpha: 0.12,
                              ),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: const Text(
                              'Default',
                              style: TextStyle(
                                color: AppColors.primaryGreen,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      address.fullAddress,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        height: 1.5,
                      ),
                    ),
                    if (address.houseNumber != null ||
                        address.landmark != null) ...[
                      const SizedBox(height: 8),
                      Text(
                        [address.houseNumber, address.landmark]
                            .where((value) => value != null && value.isNotEmpty)
                            .join(' • '),
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        if (!address.isDefault)
                          TextButton(
                            onPressed: () async {
                              await ref
                                  .read(addressRepositoryProvider)
                                  .setDefaultAddress(address.id);
                              await ref
                                  .read(selectedAddressProvider.notifier)
                                  .save(address.copyWith(isDefault: true));
                              if (context.mounted) {
                                context.pop();
                              }
                            },
                            child: const Text('Set default'),
                          ),
                        const Spacer(),
                        TextButton(
                          onPressed: () =>
                              _showAddressEditor(context, ref, address),
                          child: const Text('Edit'),
                        ),
                        TextButton(
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (dialogContext) => AlertDialog(
                                title: const Text('Delete address'),
                                content: const Text(
                                  'Remove this saved address?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.of(dialogContext).pop(false),
                                    child: const Text('Cancel'),
                                  ),
                                  TextButton(
                                    onPressed: () =>
                                        Navigator.of(dialogContext).pop(true),
                                    child: const Text('Delete'),
                                  ),
                                ],
                              ),
                            );

                            if (confirm == true) {
                              await ref
                                  .read(addressRepositoryProvider)
                                  .deleteAddress(address.id);
                              if (context.mounted) {
                                context.pop();
                              }
                            }
                          },
                          child: const Text('Delete'),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _showAddressEditor(
    BuildContext context,
    WidgetRef ref,
    Address? address,
  ) async {
    final labelController = TextEditingController(
      text: address?.label ?? 'Home',
    );
    final houseController = TextEditingController(
      text: address?.houseNumber ?? '',
    );
    final landmarkController = TextEditingController(
      text: address?.landmark ?? '',
    );

    final result = await showModalBottomSheet<Address>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(sheetContext).viewInsets.bottom,
          left: 16,
          right: 16,
          top: 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 8),
            Text(
              address == null ? 'Add address' : 'Edit address',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: labelController,
              decoration: const InputDecoration(
                labelText: 'Label',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: houseController,
              decoration: const InputDecoration(
                labelText: 'House / Flat no.',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: landmarkController,
              decoration: const InputDecoration(
                labelText: 'Landmark (optional)',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: () async {
                final nextAddress = Address(
                  id:
                      address?.id ??
                      DateTime.now().microsecondsSinceEpoch.toString(),
                  fullAddress: address?.fullAddress ?? 'Bengaluru',
                  label: labelController.text.trim().isEmpty
                      ? 'Home'
                      : labelController.text.trim(),
                  houseNumber: houseController.text.trim(),
                  landmark: landmarkController.text.trim().isEmpty
                      ? null
                      : landmarkController.text.trim(),
                  latitude: address?.latitude ?? 12.9716,
                  longitude: address?.longitude ?? 77.5946,
                  isDefault: address?.isDefault ?? false,
                  serviceAreaValid: address?.serviceAreaValid ?? true,
                );
                Navigator.of(sheetContext).pop(nextAddress);
              },
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                backgroundColor: AppColors.primaryGreen,
              ),
              child: Text(address == null ? 'Save address' : 'Update address'),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );

    if (result == null) return;

    if (address == null) {
      await ref.read(addressRepositoryProvider).saveAddress(result);
      if (context.mounted) {
        context.pop();
      }
      return;
    }

    final updated = result.copyWith(
      id: address.id,
      isDefault: address.isDefault,
    );
    await ref.read(addressRepositoryProvider).saveAddress(updated);
    if (context.mounted) {
      context.pop();
    }
  }
}

class PaymentModesScreen extends StatelessWidget {
  const PaymentModesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment Modes'),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      backgroundColor: AppColors.background,
      body: const Center(child: Text('No payment methods added yet')),
    );
  }
}

class RefundsScreen extends StatelessWidget {
  const RefundsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Refunds'),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      backgroundColor: AppColors.background,
      body: const Center(child: Text('No refunds yet')),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: AppColors.background,
        elevation: 0,
      ),
      backgroundColor: AppColors.background,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: const [
          Row(
            children: [
              Expanded(
                child: Text(
                  'Push notifications',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              Switch(value: true, onChanged: null),
            ],
          ),
          SizedBox(height: 18),
          Divider(),
          SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'App version',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              Text('1.0.0', style: TextStyle(color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }
}

class ProfileSettingsMenu extends StatelessWidget {
  const ProfileSettingsMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert_rounded),
      onSelected: (value) {
        switch (value) {
          case 'edit':
            context.push('/profile/edit');
            break;
          case 'settings':
            context.push('/profile/settings');
            break;
          case 'logout':
            _confirmLogout(context);
            break;
        }
      },
      itemBuilder: (context) => const [
        PopupMenuItem(value: 'edit', child: Text('Edit Profile')),
        PopupMenuItem(value: 'settings', child: Text('Settings')),
        PopupMenuItem(value: 'logout', child: Text('Logout')),
      ],
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              await SecureTokenStore.clear();
              await AppPreferences.clear();
              if (context.mounted) {
                Navigator.of(dialogContext).pop();
                context.go('/login');
              }
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}
