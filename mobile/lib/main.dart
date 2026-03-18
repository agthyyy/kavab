import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_cubit.dart';
import 'package:kavabanga/features/auth/presentation/pages/login_page.dart';
import 'package:kavabanga/features/learning_tree/presentation/pages/home_page.dart';
import 'package:kavabanga/features/lesson/presentation/pages/lesson_page.dart';
import 'package:kavabanga/features/notifications/presentation/cubit/notification_cubit.dart';
import 'package:kavabanga/features/profile/presentation/pages/profile_page.dart';
import 'package:kavabanga/features/quiz/presentation/pages/quiz_page.dart';
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
      child: MaterialApp(
        title: 'Kavabanga',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF4A2C2A),
            primary: const Color(0xFF2C1810),
            secondary: const Color(0xFFC8860A),
            surface: const Color(0xFFF5F0EB),
          ),
          useMaterial3: true,
          textTheme: GoogleFonts.interTextTheme(),
          scaffoldBackgroundColor: const Color(0xFFF5F0EB),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF2C1810),
            foregroundColor: Colors.white,
            elevation: 0,
            centerTitle: true,
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFC8860A),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          cardTheme: CardThemeData(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            color: Colors.white,
          ),
          snackBarTheme: SnackBarThemeData(
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        ),
        initialRoute: '/',
        onGenerateRoute: (settings) {
          switch (settings.name) {
            case '/':
              return MaterialPageRoute(builder: (_) => const LoginPage());
            case '/home':
              return MaterialPageRoute(builder: (_) => const HomePage());
            case '/lesson':
              final lessonId = settings.arguments as String;
              return MaterialPageRoute(
                  builder: (_) => LessonPage(lessonId: lessonId));
            case '/quiz':
              final quizId = settings.arguments as String;
              return MaterialPageRoute(
                  builder: (_) => QuizPage(quizId: quizId));
            case '/profile':
              return MaterialPageRoute(builder: (_) => const ProfilePage());
            default:
              return MaterialPageRoute(builder: (_) => const LoginPage());
          }
        },
      ),
    );
  }
}
