part of 'lesson_cubit.dart';

abstract class LessonState extends Equatable {
  const LessonState();
  @override
  List<Object?> get props => [];
}

class LessonInitial extends LessonState {}

class LessonLoading extends LessonState {}

class LessonLoaded extends LessonState {
  final LessonEntity lesson;
  const LessonLoaded(this.lesson);
  @override
  List<Object?> get props => [lesson];
}

class LessonCompleting extends LessonState {
  final LessonEntity lesson;
  const LessonCompleting(this.lesson);
  @override
  List<Object?> get props => [lesson];
}

class LessonCompleted extends LessonState {
  final LessonEntity lesson;
  final int xpEarned;
  const LessonCompleted(this.lesson, {this.xpEarned = 0});
  @override
  List<Object?> get props => [lesson, xpEarned];
}

class LessonError extends LessonState {
  final String message;
  const LessonError(this.message);
  @override
  List<Object?> get props => [message];
}
