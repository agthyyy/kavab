import 'package:kavabanga/features/auth/domain/entities/user_entity.dart';

class AuthResponseModel {
  final String accessToken;
  final String refreshToken;
  final UserModel user;

  const AuthResponseModel({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    return AuthResponseModel(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: UserModel.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}

class UserModel {
  final String id;
  final String fullName;
  final String role;

  const UserModel({
    required this.id,
    required this.fullName,
    required this.role,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      fullName: (json['fullName'] ?? json['full_name']) as String,
      role: json['role'] as String,
    );
  }

  UserEntity toEntity() {
    return UserEntity(id: id, fullName: fullName, role: role);
  }
}
