import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/features/lesson/data/models/lesson_model.dart';
import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';

abstract class LessonRemoteDataSource {
  Future<LessonEntity> getLesson(String lessonId);
  Future<int> completeLesson(String lessonId);
}

class LessonRemoteDataSourceImpl implements LessonRemoteDataSource {
  final ApiClient apiClient;
  LessonRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<LessonEntity> getLesson(String lessonId) async {
    final url = ApiConstants.lesson.replaceFirst('{id}', lessonId);
    final response = await apiClient.get(url);
    return LessonModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<int> completeLesson(String lessonId) async {
    final url = ApiConstants.completeLesson.replaceFirst('{id}', lessonId);
    final response = await apiClient.post(url, data: {});
    final data = response.data as Map<String, dynamic>?;
    return (data?['xpEarned'] as num?)?.toInt() ?? 10;
  }
}
