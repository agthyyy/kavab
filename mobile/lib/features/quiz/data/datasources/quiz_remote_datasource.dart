import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';
import 'package:kavabanga/features/quiz/data/models/quiz_model.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';

abstract class QuizRemoteDataSource {
  Future<QuizEntity> getQuiz(String quizId);
  Future<QuizResult> submitQuiz(String quizId, Map<String, dynamic> answers);
}

class QuizRemoteDataSourceImpl implements QuizRemoteDataSource {
  final ApiClient apiClient;
  QuizRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<QuizEntity> getQuiz(String quizId) async {
    final url = ApiConstants.quiz.replaceFirst('{id}', quizId);
    final response = await apiClient.get(url);
    return QuizModel.fromJson(response.data as Map<String, dynamic>);
  }

  @override
  Future<QuizResult> submitQuiz(
      String quizId, Map<String, dynamic> answers) async {
    final url = ApiConstants.submitQuiz.replaceFirst('{id}', quizId);
    final response = await apiClient.post(url, data: answers);
    return QuizModel.resultFromJson(response.data as Map<String, dynamic>);
  }
}
