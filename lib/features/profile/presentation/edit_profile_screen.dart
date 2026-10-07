import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/profile/domain/profile_repository.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _emailController;
  String? _photoUrl;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(profileRepositoryProvider).getProfile();
    profile.then((value) {
      if (!mounted) return;
      _nameController.text = value.name;
      _emailController.text = value.email;
      setState(() => _photoUrl = value.photoUrl);
    });
    _nameController = TextEditingController();
    _emailController = TextEditingController();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        title: const Text('Edit Profile'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
          children: [
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.surfaceVariant,
                      image: _photoUrl != null
                          ? DecorationImage(
                              image: NetworkImage(_photoUrl!),
                              fit: BoxFit.cover,
                            )
                          : null,
                    ),
                    child: _photoUrl == null
                        ? const Icon(
                            Icons.person_rounded,
                            size: 44,
                            color: AppColors.primaryGreen,
                          )
                        : null,
                  ),
                  Positioned(
                    right: 0,
                    bottom: 0,
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: AppColors.primaryGreen,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.background,
                          width: 3,
                        ),
                      ),
                      child: const Icon(
                        Icons.camera_alt_rounded,
                        size: 18,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            TextFormField(
              controller: _nameController,
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) {
                  return 'Please enter your name';
                }
                if (text.length < 2) {
                  return 'Name should be at least 2 characters';
                }
                return null;
              },
              decoration: const InputDecoration(
                labelText: 'Full Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                final text = value?.trim() ?? '';
                if (text.isEmpty) return 'Please enter your email';
                final hasAt = text.contains('@') && text.contains('.');
                if (!hasAt) return 'Enter a valid email address';
                return null;
              },
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 28),
            FilledButton(
              onPressed: () async {
                if (!_formKey.currentState!.validate()) return;

                final repo = ref.read(profileRepositoryProvider);
                final current = await repo.getProfile();
                final next = current.copyWith(
                  name: _nameController.text.trim(),
                  email: _emailController.text.trim(),
                  photoUrl: _photoUrl,
                );

                await repo.saveProfile(next);
                if (!context.mounted) return;
                Navigator.of(context).pop();
              },
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                backgroundColor: AppColors.primaryGreen,
              ),
              child: const Text('Save Changes'),
            ),
          ],
        ),
      ),
    );
  }
}
