import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_bloc.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_event.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_state.dart';
import 'package:kavabanga/features/learning_tree/presentation/widgets/learning_path_map.dart';
import 'package:kavabanga/injection_container.dart';

class CourseDetailPage extends StatelessWidget {
  final String courseId;

  const CourseDetailPage({super.key, required this.courseId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<LearningTreeBloc>(
      create: (_) => sl<LearningTreeBloc>()..add(LoadLearningTree(courseId)),
      child: _CourseDetailView(courseId: courseId),
    );
  }
}

class _CourseDetailView extends StatelessWidget {
  final String courseId;

  const _CourseDetailView({required this.courseId});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: const Color(0xFF2C1810),
        foregroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: BlocBuilder<LearningTreeBloc, LearningTreeState>(
          builder: (context, state) {
            String title = 'Карта курса';
            if (state is LearningTreeLoaded) {
              title = state.courseTitle;
            }
            return Text(
              title,
              style: GoogleFonts.outfit(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            );
          },
        ),
        centerTitle: true,
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
                    child: Icon(Icons.wifi_off_rounded, size: 48, color: Colors.red.shade300),
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
                        .add(LoadLearningTree(courseId)),
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Повторить'),
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

          if (state is LearningTreeLoaded) {
            if (state.modules.isEmpty) {
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
                      child: const Icon(Icons.folder_open_rounded,
                          size: 56, color: Color(0xFFC8860A)),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      'Нет модулей',
                      style: GoogleFonts.outfit(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF2C1810),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'В этом курсе пока нет модулей',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              color: const Color(0xFFC8860A),
              onRefresh: () async {
                context
                    .read<LearningTreeBloc>()
                    .add(RefreshLearningTree(courseId));
                await Future.delayed(const Duration(milliseconds: 500));
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  children: [
                    const SizedBox(height: 20),
                    LearningPathMap(
                      modules: state.modules,
                      onModuleTap: (module) => _onModuleTap(context, module),
                    ),
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

  void _onModuleTap(BuildContext context, ModuleNode module) {
    switch (module.status) {
      case ModuleStatus.available:
      case ModuleStatus.completed:
        if (module.firstLessonId != null) {
          Navigator.of(context).pushNamed('/lesson', arguments: module.firstLessonId);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('В этом модуле пока нет уроков'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
        break;
      case ModuleStatus.locked:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.lock_rounded, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Text(
                  'Сначала завершите предыдущий модуль',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ],
            ),
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFF2C1810),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
        break;
    }
  }
}
