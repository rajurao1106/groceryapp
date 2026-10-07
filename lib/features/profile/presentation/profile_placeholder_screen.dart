import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/core/storage/app_preferences.dart';
import 'package:grocery_app/core/storage/secure_token_store.dart';
import 'package:grocery_app/features/profile/domain/profile_repository.dart';

class ProfilePlaceholderScreen extends ConsumerWidget {
  const ProfilePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(profileRepositoryProvider).getProfile();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        title: const Text('Profile'),
        actions: const [ProfileSettingsMenu()],
      ),
      body: FutureBuilder<ProfileUser>(
        future: profile,
        builder: (context, snapshot) {
          final user =
              snapshot.data ??
              const ProfileUser(
                name: 'Aisha Kumar',
                phone: '+91 98765 43210',
                email: 'aisha@example.com',
              );

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 58,
                      height: 58,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(16),
                        image: user.photoUrl != null
                            ? DecorationImage(
                                image: NetworkImage(user.photoUrl!),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: user.photoUrl == null
                          ? const Icon(
                              Icons.person_rounded,
                              color: AppColors.primaryGreen,
                              size: 28,
                            )
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user.phone,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
              _ProfileTile(
                title: 'Saved Addresses',
                subtitle: 'Manage delivery locations',
                icon: Icons.location_on_outlined,
                onTap: () => context.push('/profile/addresses'),
              ),
              const SizedBox(height: 12),
              _ProfileTile(
                title: 'Payment Modes',
                subtitle: 'Manage saved payment methods',
                icon: Icons.wallet_rounded,
                onTap: () => context.push('/profile/payment-modes'),
              ),
              const SizedBox(height: 12),
              _ProfileTile(
                title: 'My Refunds',
                subtitle: 'Track request status',
                icon: Icons.undo_rounded,
                onTap: () => context.push('/profile/refunds'),
              ),
              const SizedBox(height: 12),
              _ProfileTile(
                title: 'My Wishlist',
                subtitle: 'View saved favourites',
                icon: Icons.favorite_rounded,
                onTap: () => context.go('/wishlist'),
              ),
              const SizedBox(height: 12),
              _ProfileTile(
                title: 'Past Orders',
                subtitle: 'Track and reorder purchases',
                icon: Icons.receipt_long_rounded,
                onTap: () => context.push('/orders'),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  const _ProfileTile({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: AppColors.primaryGreen),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_right_rounded,
              color: AppColors.textSecondary,
            ),
          ],
        ),
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

  Future<void> _confirmLogout(BuildContext context) async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (shouldLogout != true) {
      return;
    }

    await SecureTokenStore.clear();
    await AppPreferences.clear();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('saved_addresses');
    await prefs.remove('profile_user');
    if (context.mounted) {
      context.go('/login');
    }
  }
}
