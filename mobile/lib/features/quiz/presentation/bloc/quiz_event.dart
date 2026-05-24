part of 'quiz_bloc.dart';

abstract class QuizEvent extends Equatable {
  const QuizEvent();
  @override
  List<Object?> get props => [];
}

class LoadQuiz extends QuizEvent {
  final String quizId;
  const LoadQuiz(this.quizId);
  @override
  List<Object?> get props => [quizId];
}

class AnswerQuestion extends QuizEvent {
  final String questionId;
  final dynamic answer;
  const AnswerQuestion({required this.questionId, required this.answer});
  @override
  List<Object?> get props => [questionId, answer];
}

class SubmitQuiz extends QuizEvent {
  const SubmitQuiz();
}

class NavigateToQuestion extends QuizEvent {
  final int index;
  const NavigateToQuestion(this.index);
  @override
  List<Object?> get props => [index];
}
