import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/features/learning_tree/data/models/course_model.dart';
import 'package:kavabanga/features/learning_tree/data/models/module_node_model.dart';
import 'package:kavabanga/features/learning_tree/data/models/user_progress_model.dart';

abstract class LearningTreeRemoteDataSource {
  Future<List<ModuleNodeModel>> getCourseTree(String courseId);
  Future<UserProgressModel> getUserProgress();
  Future<List<CourseModel>> getCourses();
}

class LearningTreeRemoteDataSourceImpl implements LearningTreeRemoteDataSource {
  final ApiClient _apiClient;

  const LearningTreeRemoteDataSourceImpl({required ApiClient apiClient})
      : _apiClient = apiClient;

  @override
  Future<List<ModuleNodeModel>> getCourseTree(String courseId) async {
    final url = ApiConstants.courseTree.replaceFirst('{id}', courseId);
    final response = await _apiClient.dio.get(url);
    // Backend returns { modules: [...] }
    final body = response.data as Map<String, dynamic>;
    final data = body['modules'] as List<dynamic>;
    return data
        .map((e) => ModuleNodeModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  @override
  Future<UserProgressModel> getUserProgress() async {
    final response = await _apiClient.dio.get(ApiConstants.progressMe);
    return UserProgressModel.fromJson(
      response.data as Map<String, dynamic>,
    );
  }

  @override
  Future<List<CourseModel>> getCourses() async {
    final response = await _apiClient.dio.get(ApiConstants.courses);
    final data = response.data as List<dynamic>;
    return data
        .map((e) => CourseModel.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
