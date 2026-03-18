import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:kavabanga/features/quiz/presentation/bloc/quiz_bloc.dart';
import 'package:kavabanga/features/quiz/presentation/pages/quiz_result_page.dart';
import 'package:kavabanga/features/quiz/presentation/widgets/question_widget.dart';
import 'package:kavabanga/injection_container.dart';

class QuizPage extends StatelessWidget {
  final String quizId;
  const QuizPage({super.key, required this.quizId});

  @override
  Widget build(BuildContext context) {
    return BlocProvider<QuizBloc>(
      create: (_) => sl<QuizBloc>()..add(LoadQuiz(quizId)),
      child: const _QuizView(),
    );
  }
}

class _QuizView extends StatelessWidget {
  const _QuizView();

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<QuizBloc, QuizState>(
      listener: (context, state) {
        if (state is QuizResultState) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(
              builder: (_) => QuizResultPage(
                quiz: state.quiz,
                result: state.result,
              ),
            ),
          );
        }
      },
      builder: (context, state) {
        if (state is QuizLoading || state is QuizInitial) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (state is QuizError) {
          return Scaffold(
            appBar: AppBar(),
            body: Center(
              child: Text(state.message,
                  style: const TextStyle(color: Colors.grey)),
            ),
          );
        }

        if (state is QuizInProgress || state is QuizSubmitting) {
          final s = state is QuizInProgress
              ? state
              : QuizInProgress(
                  quiz: (state as QuizSubmitting).quiz,
                  currentIndex: 0,
                  answers: state.answers,
                );

          final quiz = s.quiz;
          final question = quiz.questions[s.currentIndex];
          final total = quiz.questions.length;
          final current = s.currentIndex + 1;
          final isSubmitting = state is QuizSubmitting;

          return Scaffold(
            appBar: AppBar(
              title: Text(quiz.title),
              centerTitle: true,
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(4),
                child: LinearProgressIndicator(
                  value: current / total,
                  backgroundColor: Colors.grey[200],
                  color: const Color(0xFFC8860A),
                ),
              ),
            ),
            body: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Question $current of $total',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      Text(
                        'Pass: ${quiz.passThreshold}%',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: QuestionWidget(
                      question: question,
                      selectedAnswer: s.answers[question.id],
                      onAnswer: (answer) {
                        context.read<QuizBloc>().add(AnswerQuestion(
                              questionId: question.id,
                              answer: answer,
                            ));
                      },
                    ),
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        if (s.currentIndex > 0)
                          Expanded(
                            child: OutlinedButton(
                              onPressed: () {
                                context.read<QuizBloc>().add(AnswerQuestion(
                                      questionId: question.id,
                                      answer: s.answers[question.id],
                                    ));
                                // go back
                                final bloc = context.read<QuizBloc>();
                                final cur = (bloc.state as QuizInProgress);
                                bloc.emit(cur.copyWith(
                                    currentIndex: cur.currentIndex - 1));
                              },
                              child: const Text('Back'),
                            ),
                          ),
                        if (s.currentIndex > 0) const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: ElevatedButton(
                            onPressed: isSubmitting ||
                                    s.answers[question.id] == null
                                ? null
                                : () {
                                    if (s.currentIndex < total - 1) {
                                      context.read<QuizBloc>().add(
                                            AnswerQuestion(
                                              questionId: question.id,
                                              answer: s.answers[question.id],
                                            ),
                                          );
                                      final bloc = context.read<QuizBloc>();
                                      final cur =
                                          (bloc.state as QuizInProgress);
                                      bloc.emit(cur.copyWith(
                                          currentIndex:
                                              cur.currentIndex + 1));
                                    } else {
                                      context
                                          .read<QuizBloc>()
                                          .add(const SubmitQuiz());
                                    }
                                  },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFC8860A),
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(52),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                            child: isSubmitting
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                        strokeWidth: 2, color: Colors.white),
                                  )
                                : Text(
                                    s.currentIndex < total - 1
                                        ? 'Next'
                                        : 'Submit',
                                    style: const TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        }

        return const SizedBox.shrink();
      },
    );
  }
}
