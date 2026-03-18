import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:kavabanga/features/lesson/domain/entities/lesson_entity.dart';
import 'package:kavabanga/features/lesson/domain/usecases/get_lesson_usecase.dart';
import 'package:kavabanga/features/lesson/domain/usecases/complete_lesson_usecase.dart';

part 'lesson_state.dart';

class LessonCubit extends Cubit<LessonState> {
  final GetLessonUseCase getLesson;
  final CompleteLessonUseCase completeLesson;

  LessonCubit({required this.getLesson, required this.completeLesson})
      : super(LessonInitial());

  Future<void> loadLesson(String lessonId) async {
    emit(LessonLoading());
    final result = await getLesson(lessonId);
    result.fold(
      (failure) => emit(LessonError(failure.message)),
      (lesson) => emit(LessonLoaded(lesson)),
    );
  }

  Future<void> complete(String lessonId) async {
    final current = state;
    if (current is! LessonLoaded) return;
    emit(LessonCompleting(current.lesson));
    final result = await completeLesson(lessonId);
    result.fold(
      (failure) => emit(LessonError(failure.message)),
      (xp) => emit(LessonCompleted(current.lesson, xpEarned: xp)),
    );
  }
}
