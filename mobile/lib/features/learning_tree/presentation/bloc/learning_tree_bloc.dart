import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/features/learning_tree/data/datasources/learning_tree_remote_datasource.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_course_tree_usecase.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_user_progress_usecase.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_event.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_state.dart';

class LearningTreeBloc extends Bloc<LearningTreeEvent, LearningTreeState> {
  final GetCourseTreeUseCase _getCourseTree;
  final GetUserProgressUseCase _getUserProgress;
  final LearningTreeRemoteDataSource _remoteDataSource;

  LearningTreeBloc({
    required GetCourseTreeUseCase getCourseTree,
    required GetUserProgressUseCase getUserProgress,
    required LearningTreeRemoteDataSource remoteDataSource,
  })  : _getCourseTree = getCourseTree,
        _getUserProgress = getUserProgress,
        _remoteDataSource = remoteDataSource,
        super(const LearningTreeInitial()) {
    on<LoadLearningTree>(_onLoad);
    on<RefreshLearningTree>(_onRefresh);
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
    // Resolve courseId: if empty, fetch first available course
    String resolvedCourseId = courseId;
    if (resolvedCourseId.isEmpty) {
      try {
        final courses = await _remoteDataSource.getCourses();
        // Filter only published courses
        final published = courses.where((c) => c['is_published'] == true).toList();
        if (published.isEmpty) {
          emit(const LearningTreeEmpty());
          return;
        }
        resolvedCourseId = published.first['id'] as String;
      } catch (_) {
        emit(const LearningTreeEmpty());
        return;
      }
    }

    // Fetch tree and progress in parallel
    final treeResult = await _getCourseTree(resolvedCourseId);
    final progressResult = await _getUserProgress();

    treeResult.fold(
      (failure) => emit(LearningTreeError(failure.message)),
      (modules) {
        progressResult.fold(
          (failure) => emit(LearningTreeError(failure.message)),
          (progress) => emit(
            LearningTreeLoaded(modules: modules, progress: progress),
          ),
        );
      },
    );
  }
}
