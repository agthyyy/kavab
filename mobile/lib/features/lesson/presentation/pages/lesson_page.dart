import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/core/widgets/xp_gain_overlay.dart';
import 'package:kavabanga/core/widgets/html_content.dart';
import 'package:kavabanga/features/lesson/presentation/cubit/lesson_cubit.dart';
import 'package:kavabanga/features/lesson/presentation/widgets/lesson_block_widget.dart';
import 'package:kavabanga/injection_container.dart';

class LessonPage extends StatelessWidget {
  final String lessonId;
  const LessonPage({super.key, required this.lessonId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<LessonCubit>(
      create: (_) => sl<LessonCubit>()..loadLesson(lessonId),
      child: _LessonView(lessonId: lessonId),
    );
  }
}

class _LessonView extends StatelessWidget {
  final String lessonId;
  const _LessonView({required this.lessonId});

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<LessonCubit, LessonState>(
      listener: (context, state) {
        if (state is LessonCompleted) {
          final lesson = state.lesson;
          // Show XP popup then navigate
          final delay = state.xpEarned > 0 ? 900 : 100;
          if (state.xpEarned > 0) {
            showXpGain(context, state.xpEarned);
          }
          Future.delayed(Duration(milliseconds: delay), () {
            if (!context.mounted) return;
            print('[LessonCompleted] quizId: ${lesson.quizId}, nextLessonId: ${lesson.nextLessonId}');
            if (lesson.quizId != null) {
              print('[LessonCompleted] Navigating to quiz: ${lesson.quizId}');
              Navigator.of(context).pushReplacementNamed('/quiz', arguments: lesson.quizId);
            } else if (lesson.nextLessonId != null) {
              print('[LessonCompleted] Navigating to next lesson: ${lesson.nextLessonId}');
              Navigator.of(context).pushReplacementNamed('/lesson', arguments: lesson.nextLessonId);
            } else {
              print('[LessonCompleted] Popping back');
              Navigator.of(context).pop(true);
            }
          });
        }
      },
      builder: (context, state) {
        if (state is LessonLoading || state is LessonInitial) {
          return const Scaffold(
            backgroundColor: Color(0xFFF5F0EB),
            body: Center(
              child: CircularProgressIndicator(color: Color(0xFFC8860A)),
            ),
          );
        }

        if (state is LessonError) {
          return Scaffold(
            backgroundColor: const Color(0xFFF5F0EB),
            appBar: _buildAppBar(context, ''),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.wifi_off, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(state.message,
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey[600])),
                  const SizedBox(height: 20),
                  ElevatedButton.icon(
                    onPressed: () =>
                        context.read<LessonCubit>().loadLesson(lessonId),
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
            ),
          );
        }

        final lesson = switch (state) {
          LessonLoaded(:final lesson) => lesson,
          LessonCompleting(:final lesson) => lesson,
          LessonCompleted(:final lesson) => lesson,
          _ => null,
        };

        if (lesson == null) return const SizedBox.shrink();

        final isCompleting = state is LessonCompleting;
        final hasNext = lesson.nextLessonId != null;
        final hasQuiz = lesson.quizId != null;

        String btnLabel;
        IconData btnIcon;
        if (hasQuiz) {
          btnLabel = 'Завершить и пройти тест';
          btnIcon = Icons.quiz_rounded;
        } else if (hasNext) {
          btnLabel = 'Завершить и следующий урок';
          btnIcon = Icons.arrow_forward_rounded;
        } else {
          btnLabel = 'Завершить урок';
          btnIcon = Icons.check_rounded;
        }

        return Scaffold(
          backgroundColor: const Color(0xFFF5F0EB),
          appBar: _buildAppBar(context, lesson.title),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            children: [
              if (lesson.description != null &&
                  lesson.description!.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF2C1810), Color(0xFF4A2C2A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2C1810).withOpacity(0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: const Color(0xFFC8860A).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.info_outline_rounded,
                            color: Color(0xFFC8860A), size: 18),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: HtmlContent(
                          htmlData: lesson.description!,
                          defaultTextStyle: const TextStyle(
                            fontSize: 14,
                            color: Colors.white,
                            height: 1.6,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
              ],
              ...lesson.blocks.map((block) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: LessonBlockWidget(block: block),
                  )),
              const SizedBox(height: 100),
            ],
          ),
          bottomNavigationBar: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 16,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                child: ElevatedButton.icon(
                  onPressed: isCompleting
                      ? null
                      : () => context.read<LessonCubit>().complete(lesson.id),
                  icon: isCompleting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                      : Icon(btnIcon),
                  label: Text(
                    isCompleting ? 'Сохранение...' : btnLabel,
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFC8860A),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor:
                        const Color(0xFFC8860A).withOpacity(0.5),
                    minimumSize: const Size.fromHeight(52),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  AppBar _buildAppBar(BuildContext context, String title) {
    return AppBar(
      backgroundColor: const Color(0xFF2C1810),
      foregroundColor: Colors.white,
      elevation: 0,
      title: Text(
        title,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 17,
          fontWeight: FontWeight.w600,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      centerTitle: true,
      leading: IconButton(
        icon: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.arrow_back_ios_new_rounded,
              color: Colors.white, size: 16),
        ),
        onPressed: () => Navigator.of(context).pop(),
      ),
    );
  }
}
