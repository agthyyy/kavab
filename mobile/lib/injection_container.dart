import 'package:get_it/get_it.dart';
import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/storage/secure_storage.dart';

// Auth
import 'package:kavabanga/features/auth/data/datasources/auth_remote_datasource.dart';
import 'package:kavabanga/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:kavabanga/features/auth/domain/repositories/auth_repository.dart';
import 'package:kavabanga/features/auth/domain/usecases/login_usecase.dart';
import 'package:kavabanga/features/auth/domain/usecases/logout_usecase.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_cubit.dart';

// Learning Tree
import 'package:kavabanga/features/learning_tree/data/datasources/learning_tree_remote_datasource.dart';
import 'package:kavabanga/features/learning_tree/data/repositories/learning_tree_repository_impl.dart';
import 'package:kavabanga/features/learning_tree/domain/repositories/learning_tree_repository.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_course_tree_usecase.dart';
import 'package:kavabanga/features/learning_tree/domain/usecases/get_user_progress_usecase.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_bloc.dart';

// Lesson
import 'package:kavabanga/features/lesson/data/datasources/lesson_remote_datasource.dart';
import 'package:kavabanga/features/lesson/data/repositories/lesson_repository_impl.dart';
import 'package:kavabanga/features/lesson/domain/repositories/lesson_repository.dart';
import 'package:kavabanga/features/lesson/domain/usecases/complete_lesson_usecase.dart';
import 'package:kavabanga/features/lesson/domain/usecases/get_lesson_usecase.dart';
import 'package:kavabanga/features/lesson/presentation/cubit/lesson_cubit.dart';

// Quiz
import 'package:kavabanga/features/quiz/data/datasources/quiz_remote_datasource.dart';
import 'package:kavabanga/features/quiz/data/repositories/quiz_repository_impl.dart';
import 'package:kavabanga/features/quiz/domain/repositories/quiz_repository.dart';
import 'package:kavabanga/features/quiz/domain/usecases/get_quiz_usecase.dart';
import 'package:kavabanga/features/quiz/domain/usecases/submit_quiz_usecase.dart';
import 'package:kavabanga/features/quiz/presentation/bloc/quiz_bloc.dart';

// Gamification
import 'package:kavabanga/features/gamification/data/datasources/gamification_remote_datasource.dart';
import 'package:kavabanga/features/gamification/data/repositories/gamification_repository_impl.dart';
import 'package:kavabanga/features/gamification/domain/repositories/gamification_repository.dart';
import 'package:kavabanga/features/gamification/presentation/cubit/gamification_cubit.dart';

// Notifications
import 'package:kavabanga/features/notifications/presentation/cubit/notification_cubit.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  // Core
  sl.registerLazySingleton<SecureStorage>(() => SecureStorage());
  sl.registerLazySingleton<ApiClient>(() => ApiClient(sl<SecureStorage>()));

  // Auth
  sl.registerLazySingleton<AuthRemoteDataSource>(
    () => AuthRemoteDataSourceImpl(
      apiClient: sl<ApiClient>(),
      secureStorage: sl<SecureStorage>(),
    ),
  );
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(sl<AuthRemoteDataSource>()),
  );
  sl.registerLazySingleton<LoginUseCase>(
      () => LoginUseCase(sl<AuthRepository>()));
  sl.registerLazySingleton<LogoutUseCase>(
      () => LogoutUseCase(sl<AuthRepository>()));
  sl.registerFactory<AuthCubit>(
    () => AuthCubit(
      loginUseCase: sl<LoginUseCase>(),
      logoutUseCase: sl<LogoutUseCase>(),
      secureStorage: sl<SecureStorage>(),
    ),
  );

  // Learning Tree
  sl.registerLazySingleton<LearningTreeRemoteDataSource>(
    () => LearningTreeRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<LearningTreeRepository>(
    () => LearningTreeRepositoryImpl(sl<LearningTreeRemoteDataSource>()),
  );
  sl.registerLazySingleton<GetCourseTreeUseCase>(
    () => GetCourseTreeUseCase(sl<LearningTreeRepository>()),
  );
  sl.registerLazySingleton<GetUserProgressUseCase>(
    () => GetUserProgressUseCase(sl<LearningTreeRepository>()),
  );
  sl.registerFactory<LearningTreeBloc>(
    () => LearningTreeBloc(
      getCourseTree: sl<GetCourseTreeUseCase>(),
      getUserProgress: sl<GetUserProgressUseCase>(),
      remoteDataSource: sl<LearningTreeRemoteDataSource>(),
    ),
  );

  // Lesson
  sl.registerLazySingleton<LessonRemoteDataSource>(
    () => LessonRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<LessonRepository>(
    () => LessonRepositoryImpl(sl<LessonRemoteDataSource>()),
  );
  sl.registerLazySingleton<GetLessonUseCase>(
    () => GetLessonUseCase(sl<LessonRepository>()),
  );
  sl.registerLazySingleton<CompleteLessonUseCase>(
    () => CompleteLessonUseCase(sl<LessonRepository>()),
  );
  sl.registerFactory<LessonCubit>(
    () => LessonCubit(
      getLesson: sl<GetLessonUseCase>(),
      completeLesson: sl<CompleteLessonUseCase>(),
    ),
  );

  // Quiz
  sl.registerLazySingleton<QuizRemoteDataSource>(
    () => QuizRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<QuizRepository>(
    () => QuizRepositoryImpl(sl<QuizRemoteDataSource>()),
  );
  sl.registerLazySingleton<GetQuizUseCase>(
    () => GetQuizUseCase(sl<QuizRepository>()),
  );
  sl.registerLazySingleton<SubmitQuizUseCase>(
    () => SubmitQuizUseCase(sl<QuizRepository>()),
  );
  sl.registerFactory<QuizBloc>(
    () => QuizBloc(
      getQuiz: sl<GetQuizUseCase>(),
      submitQuiz: sl<SubmitQuizUseCase>(),
    ),
  );

  // Gamification
  sl.registerLazySingleton<GamificationRemoteDataSource>(
    () => GamificationRemoteDataSourceImpl(apiClient: sl<ApiClient>()),
  );
  sl.registerLazySingleton<GamificationRepository>(
    () => GamificationRepositoryImpl(sl<GamificationRemoteDataSource>()),
  );
  sl.registerFactory<GamificationCubit>(
    () => GamificationCubit(repository: sl<GamificationRepository>()),
  );

  // Notifications
  sl.registerFactory<NotificationCubit>(
    () => NotificationCubit(),
  );
}
