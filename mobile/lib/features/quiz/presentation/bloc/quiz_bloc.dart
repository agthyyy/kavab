import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';
import 'package:kavabanga/features/quiz/domain/usecases/get_quiz_usecase.dart';
import 'package:kavabanga/features/quiz/domain/usecases/submit_quiz_usecase.dart';

part 'quiz_event.dart';
part 'quiz_state.dart';

class QuizBloc extends Bloc<QuizEvent, QuizState> {
  final GetQuizUseCase getQuiz;
  final SubmitQuizUseCase submitQuiz;

  QuizBloc({required this.getQuiz, required this.submitQuiz})
      : super(QuizInitial()) {
    on<LoadQuiz>(_onLoad);
    on<AnswerQuestion>(_onAnswer);
    on<SubmitQuiz>(_onSubmit);
    on<NavigateToQuestion>(_onNavigate);
  }

  Future<void> _onLoad(LoadQuiz event, Emitter<QuizState> emit) async {
    print('[QuizBloc] _onLoad called with quizId: ${event.quizId}');
    emit(QuizLoading());
    print('[QuizBloc] Emitted QuizLoading, calling getQuiz...');
    final result = await getQuiz(event.quizId);
    print('[QuizBloc] getQuiz result: ${result.isRight() ? "success" : "failure"}');
    result.fold(
      (f) {
        print('[QuizBloc] Error loading quiz: ${f.message}');
        emit(QuizError(f.message));
      },
      (quiz) {
        print('[QuizBloc] Quiz loaded successfully with ${quiz.questions.length} questions');
        emit(QuizInProgress(
          quiz: quiz,
          currentIndex: 0,
          answers: const {},
        ));
      },
    );
  }

  void _onAnswer(AnswerQuestion event, Emitter<QuizState> emit) {
    final s = state;
    if (s is! QuizInProgress) return;
    final updated = Map<String, dynamic>.from(s.answers)
      ..[event.questionId] = event.answer;
    emit(s.copyWith(answers: updated));
  }

  Future<void> _onSubmit(SubmitQuiz event, Emitter<QuizState> emit) async {
    final s = state;
    if (s is! QuizInProgress) return;
    emit(QuizSubmitting(quiz: s.quiz, answers: s.answers));
    final result = await submitQuiz(s.quiz.id, s.answers);
    result.fold(
      (f) => emit(QuizError(f.message)),
      (quizResult) => emit(QuizResultState(quiz: s.quiz, result: quizResult)),
    );
  }

  void _onNavigate(NavigateToQuestion event, Emitter<QuizState> emit) {
    final s = state;
    if (s is! QuizInProgress) return;
    emit(s.copyWith(currentIndex: event.index));
  }
}
