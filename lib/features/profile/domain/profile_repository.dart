import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final profileRepositoryProvider = Provider<ProfileRepository>(
  (ref) => MockProfileRepository(),
);

abstract class ProfileRepository {
  Future<ProfileUser> getProfile();
  Future<void> saveProfile(ProfileUser profile);
}

class ProfileUser {
  const ProfileUser({
    required this.name,
    required this.phone,
    required this.email,
    this.photoUrl,
  });

  final String name;
  final String phone;
  final String email;
  final String? photoUrl;

  ProfileUser copyWith({
    String? name,
    String? phone,
    String? email,
    String? photoUrl,
  }) {
    return ProfileUser(
      name: name ?? this.name,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      photoUrl: photoUrl ?? this.photoUrl,
    );
  }

  Map<String, dynamic> toJson() => {
    'name': name,
    'phone': phone,
    'email': email,
    'photoUrl': photoUrl,
  };

  factory ProfileUser.fromJson(Map<String, dynamic> json) {
    return ProfileUser(
      name: json['name'] as String? ?? 'Aisha Kumar',
      phone: json['phone'] as String? ?? '+91 98765 43210',
      email: json['email'] as String? ?? 'aisha@example.com',
      photoUrl: json['photoUrl'] as String?,
    );
  }
}

class MockProfileRepository implements ProfileRepository {
  static const String _key = 'profile_user';

  @override
  Future<ProfileUser> getProfile() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) {
      return const ProfileUser(
        name: 'Aisha Kumar',
        phone: '+91 98765 43210',
        email: 'aisha@example.com',
      );
    }

    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    return ProfileUser.fromJson(decoded);
  }

  @override
  Future<void> saveProfile(ProfileUser profile) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, jsonEncode(profile.toJson()));
  }
}
