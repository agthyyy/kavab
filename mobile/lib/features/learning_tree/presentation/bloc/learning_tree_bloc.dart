import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_course_tree_usecase.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_courses_usecase.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_user_progress_usecase.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_event.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_state.dart';

class LearningTreeBloc extends Bloc<LearningTreeEvent, LearningTreeState> {
  final GetCourseTreeUseCase _getCourseTree;
  final GetUserProgressUseCase _getUserProgress;
  final GetCoursesUseCase _getCourses;

  LearningTreeBloc({
    required GetCourseTreeUseCase getCourseTree,
    required GetUserProgressUseCase getUserProgress,
    required GetCoursesUseCase getCourses,
  })  : _getCourseTree = getCourseTree,
        _getUserProgress = getUserProgress,
        _getCourses = getCourses,
        super(const LearningTreeInitial()) {
    on<LoadCourses>(_onLoadCourses);
    on<LoadLearningTree>(_onLoad);
    on<RefreshLearningTree>(_onRefresh);
  }

  Future<void> _onLoadCourses(
    LoadCourses event,
    Emitter<LearningTreeState> emit,
  ) async {
    emit(const LearningTreeLoading());
    
    final coursesResult = await _getCourses();
    final progressResult = await _getUserProgress();

    coursesResult.fold(
      (failure) => emit(LearningTreeError(failure.message)),
      (courses) {
        if (courses.isEmpty) {
          emit(const LearningTreeEmpty());
          return;
        }
        progressResult.fold(
          (failure) => emit(LearningTreeError(failure.message)),
          (progress) => emit(
            CoursesLoaded(courses: courses, progress: progress),
          ),
        );
      },
    );
  }

  Future<void> _onLoad(
    LoadLearningTree event,
    Emitter<LearningTreeState> emit,
  ) async {
    emit(const LearningTreeLoading());
    await _fetchAndEmit(event.courseId, emit);
  }

  Future<void> _onRefresh(
    RefreshLearningTree event,
    Emitter<LearningTreeState> emit,
  ) async {
    await _fetchAndEmit(event.courseId, emit);
  }

  Future<void> _fetchAndEmit(
    String courseId,
    Emitter<LearningTreeState> emit,
  ) async {
    print('[LearningTreeBloc] Fetching course tree for courseId: $courseId');
    
    // Fetch tree and progress in parallel
    final treeResult = await _getCourseTree(courseId);
    final progressResult = await _getUserProgress();

    print('[LearningTreeBloc] Tree result: ${treeResult.isRight()}');
    print('[LearningTreeBloc] Progress result: ${progressResult.isRight()}');

    treeResult.fold(
      (failure) {
        print('[LearningTreeBloc] Tree error: ${failure.message}');
        emit(LearningTreeError(failure.message));
      },
      (modules) {
        print('[LearningTreeBloc] Modules loaded: ${modules.length}');
        progressResult.fold(
          (failure) {
            print('[LearningTreeBloc] Progress error: ${failure.message}');
            emit(LearningTreeError(failure.message));
          },
          (progress) {
            print('[LearningTreeBloc] Progress loaded, emitting LearningTreeLoaded');
            
            emit(
              LearningTreeLoaded(
                modules: modules,
                progress: progress,
                courseId: courseId,
                courseTitle: 'Курс',
              ),
            );
          },
        );
      },
    );
  }
}
