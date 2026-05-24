import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/core/theme/app_theme.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_cubit.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_state.dart';
import 'package:kavabanga/features/auth/presentation/pages/login_page.dart';
import 'package:kavabanga/features/learning_tree/presentation/pages/course_detail_page.dart';
import 'package:kavabanga/features/learning_tree/presentation/pages/home_page.dart';
import 'package:kavabanga/features/lesson/presentation/pages/lesson_page.dart';
import 'package:kavabanga/features/notifications/presentation/cubit/notification_cubit.dart';
import 'package:kavabanga/features/profile/presentation/pages/profile_page.dart';
import 'package:kavabanga/features/quiz/presentation/pages/quiz_page.dart';
import 'package:kavabanga/features/gamification/presentation/pages/gamification_page.dart';
import 'package:kavabanga/injection_container.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (_) {
    // Firebase not configured — push notifications will be disabled
  }
  await initDependencies();
  runApp(const KavabangaApp());
}

class KavabangaApp extends StatelessWidget {
  const KavabangaApp({super.key});

  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthCubit>(
          create: (_) => sl<AuthCubit>()..checkAuth(),
        ),
        BlocProvider<NotificationCubit>(
          create: (_) => sl<NotificationCubit>()..initialize(),
        ),
      ],
      child: BlocListener<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthUnauthenticated) {
            navigatorKey.currentState?.pushNamedAndRemoveUntil('/', (route) => false);
          }
        },
        child: MaterialApp(
          navigatorKey: navigatorKey,
          title: 'Kavabanga',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeMode.light,
          initialRoute: '/',
          onGenerateRoute: (settings) {
            print('[onGenerateRoute] name: ${settings.name}, arguments: ${settings.arguments}');
            switch (settings.name) {
              case '/':
                return MaterialPageRoute(builder: (_) => const LoginPage());
              case '/home':
                return MaterialPageRoute(builder: (_) => const HomePage());
              case '/course':
                final courseId = settings.arguments as String;
                return MaterialPageRoute(
                    builder: (_) => CourseDetailPage(courseId: courseId));
              case '/lesson':
                final lessonId = settings.arguments as String;
                print('[onGenerateRoute] Navigating to lesson: $lessonId');
                return MaterialPageRoute(
                    builder: (_) => LessonPage(lessonId: lessonId));
              case '/quiz':
                final quizId = settings.arguments as String?;
                print('[onGenerateRoute] Quiz route - quizId: $quizId');
                if (quizId == null) {
                  print('[onGenerateRoute] quizId is null, redirecting to home');
                  return MaterialPageRoute(builder: (_) => const HomePage());
                }
                print('[onGenerateRoute] Creating QuizPage with quizId: $quizId');
                return MaterialPageRoute(
                    builder: (_) => QuizPage(quizId: quizId));
              case '/profile':
                return MaterialPageRoute(builder: (_) => const ProfilePage());
              case '/gamification':
                return MaterialPageRoute(builder: (_) => const GamificationPage());
              default:
                return MaterialPageRoute(builder: (_) => const LoginPage());
            }
          },
        ),
      ),
    );
  }
}
