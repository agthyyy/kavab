import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/features/gamification/data/models/user_progress_model.dart';
import 'package:kavabanga/features/gamification/domain/entities/user_progress_entity.dart';

abstract class GamificationRemoteDataSource {
  Future<UserProgressEntity> getUserProgress();
}

class GamificationRemoteDataSourceImpl
    implements GamificationRemoteDataSource {
  final ApiClient apiClient;
  GamificationRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<UserProgressEntity> getUserProgress() async {
    final progressRes = await apiClient.get(ApiConstants.progressMe);
    final achievementsRes = await apiClient.get(ApiConstants.achievements);

    final progressData =
        progressRes.data as Map<String, dynamic>;
    progressData['achievements'] =
        (achievementsRes.data as List<dynamic>?) ?? [];

    return UserProgressModel.fromJson(progressData);
  }
}
