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
    print('[QuizRemoteDataSource] getQuiz called with quizId: $quizId');
    final url = ApiConstants.quiz.replaceFirst('{id}', quizId);
    print('[QuizRemoteDataSource] Making request to: $url');
    try {
      final response = await apiClient.get(url);
      print('[QuizRemoteDataSource] Response received: ${response.data}');
      return QuizModel.fromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      print('[QuizRemoteDataSource] Error: $e');
      rethrow;
    }
  }

  @override
  Future<QuizResult> submitQuiz(
      String quizId, Map<String, dynamic> answers) async {
    print('[QuizRemoteDataSource] submitQuiz called with quizId: $quizId');
    print('[QuizRemoteDataSource] Answers: $answers');
    
    // Convert answers from {questionId: optionId} to backend format
    final answersArray = answers.entries.map((entry) => {
      'questionId': entry.key,
      'selectedOptionIds': [entry.value], // Single choice - wrap in array
    }).toList();
    
    final requestData = {'answers': answersArray};
    print('[QuizRemoteDataSource] Converted request data: $requestData');
    
    final url = ApiConstants.submitQuiz.replaceFirst('{id}', quizId);
    print('[QuizRemoteDataSource] Making submit request to: $url');
    try {
      final response = await apiClient.post(url, data: requestData);
      print('[QuizRemoteDataSource] Submit response: ${response.data}');
      return QuizModel.resultFromJson(response.data as Map<String, dynamic>);
    } catch (e) {
      print('[QuizRemoteDataSource] Submit error: $e');
      rethrow;
    }
  }
}
