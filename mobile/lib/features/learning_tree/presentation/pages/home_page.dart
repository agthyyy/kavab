import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:kavabanga/features/learning_tree/domain/entities/module_node.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_bloc.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_event.dart';
import 'package:kavabanga/features/learning_tree/presentation/bloc/learning_tree_state.dart';
import 'package:kavabanga/features/learning_tree/presentation/widgets/module_card.dart';
import 'package:kavabanga/features/learning_tree/presentation/widgets/progress_header.dart';
import 'package:kavabanga/injection_container.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<LearningTreeBloc>(
      create: (_) => sl<LearningTreeBloc>()..add(const LoadLearningTree('')),
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
                        .add(const LoadLearningTree('')),
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
                    'No courses yet',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2C1810)),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Ask your manager to assign a course',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          if (state is LearningTreeLoaded) {
            return RefreshIndicator(
              color: const Color(0xFFC8860A),
              onRefresh: () async {
                context
                    .read<LearningTreeBloc>()
                    .add(const RefreshLearningTree(''));
                await Future.delayed(const Duration(milliseconds: 500));
              },
              child: CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: ProgressHeader(progress: state.progress),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 12)),
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final module = state.modules[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: ModuleCard(
                              module: module,
                              index: index,
                              onTap: () => _onModuleTap(context, module),
                            ),
                          );
                        },
                        childCount: state.modules.length,
                      ),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
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
      context.read<LearningTreeBloc>().add(const RefreshLearningTree(''));
    }
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
              content: const Text('No lessons in this module yet'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          );
        }
        break;
      case ModuleStatus.locked:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.lock, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Text('Complete previous module first'),
              ],
            ),
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFF2C1810),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
        break;
    }
  }
}
