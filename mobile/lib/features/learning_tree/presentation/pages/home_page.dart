import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/course_entity.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_bloc.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_event.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_state.dart';
import 'package:kavabanga/features/learning_tree/presentation/widgets/course_card.dart';
import 'package:kavabanga/features/learning_tree/presentation/widgets/progress_header.dart';
import 'package:kavabanga/injection_container.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<LearningTreeBloc>(
      create: (_) => sl<LearningTreeBloc>()..add(const LoadCourses()),
      child: const _HomeView(),
    );
  }
}

class _HomeView extends StatefulWidget {
  const _HomeView();

  @override
  State<_HomeView> createState() => _HomeViewState();
}

class _HomeViewState extends State<_HomeView> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F0EB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C1810),
        elevation: 0,
        title: SvgPicture.asset(
          'assets/images/logo.svg',
          height: 36,
          fit: BoxFit.contain,
          colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
        ),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.person_outline, color: Colors.white, size: 20),
              ),
              onPressed: _goToProfile,
            ),
          ),
        ],
      ),
      body: BlocBuilder<LearningTreeBloc, LearningTreeState>(
        builder: (context, state) {
          if (state is LearningTreeLoading || state is LearningTreeInitial) {
            return const Center(
              child: CircularProgressIndicator(color: Color(0xFFC8860A)),
            );
          }

          if (state is LearningTreeError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.wifi_off, size: 48, color: Colors.red.shade300),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    state.message,
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () => context
                        .read<LearningTreeBloc>()
                        .add(const LoadCourses()),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC8860A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            );
          }

          if (state is LearningTreeEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC8860A).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.school_outlined,
                        size: 56, color: Color(0xFFC8860A)),
                  ),
                  const SizedBox(height: 20),
                  const Text(
                    'Нет курсов',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C1810)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Попросите менеджера назначить курс',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          if (state is CoursesLoaded) {
            return RefreshIndicator(
              color: const Color(0xFFC8860A),
              onRefresh: () async {
                context
                    .read<LearningTreeBloc>()
                    .add(const LoadCourses());
                await Future.delayed(const Duration(milliseconds: 500));
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    ProgressHeader(progress: state.progress),
                    const SizedBox(height: 20),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Мои курсы',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2C1810),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ...state.courses.map((course) => CourseCard(
                          course: course,
                          onTap: () => _onCourseTap(context, course),
                        )),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            );
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }

  void _goToProfile() async {
    await Navigator.of(context).pushNamed('/profile');
    if (mounted) {
      context.read<LearningTreeBloc>().add(const LoadCourses());
    }
  }

  void _onCourseTap(BuildContext context, CourseEntity course) {
    Navigator.of(context).pushNamed('/course', arguments: course.id);
  }
}
