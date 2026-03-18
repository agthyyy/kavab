part of 'quiz_bloc.dart';

abstract class QuizState extends Equatable {
  const QuizState();
  @override
  List<Object?> get props => [];
}

class QuizInitial extends QuizState {}

class QuizLoading extends QuizState {}

class QuizInProgress extends QuizState {
  final QuizEntity quiz;
  final int currentIndex;
  final Map<String, dynamic> answers;

  const QuizInProgress({
    required this.quiz,
    required this.currentIndex,
    required this.answers,
  });

  QuizInProgress copyWith({int? currentIndex, Map<String, dynamic>? answers}) =>
      QuizInProgress(
        quiz: quiz,
        currentIndex: currentIndex ?? this.currentIndex,
        answers: answers ?? this.answers,
      );

  @override
  List<Object?> get props => [quiz, currentIndex, answers];
}

class QuizSubmitting extends QuizState {
  final QuizEntity quiz;
  final Map<String, dynamic> answers;
  const QuizSubmitting({required this.quiz, required this.answers});
  @override
  List<Object?> get props => [quiz, answers];
}

class QuizResultState extends QuizState {
  final QuizEntity quiz;
  final QuizResult result;
  const QuizResultState({required this.quiz, required this.result});
  @override
  List<Object?> get props => [quiz, result];
}

class QuizError extends QuizState {
  final String message;
  const QuizError(this.message);
  @override
  List<Object?> get props => [message];
}
