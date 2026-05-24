import 'package:equatable/equatable.dart';

enum QuestionType { singleChoice, multipleChoice, matching, trueFalse }

class AnswerOption extends Equatable {
  final String id;
  final String text;
  final bool isCorrect;
  final String? explanation;

  const AnswerOption({
    required this.id,
    required this.text,
    required this.isCorrect,
    this.explanation,
  });

  @override
  List<Object?> get props => [id, text, isCorrect, explanation];
}

class MatchingPair extends Equatable {
  final String id;
  final String left;
  final String right;

  const MatchingPair({required this.id, required this.left, required this.right});

  @override
  List<Object> get props => [id, left, right];
}

class QuestionEntity extends Equatable {
  final String id;
  final String text;
  final String? imageUrl;
  final QuestionType type;
  final List<AnswerOption> options;
  final List<MatchingPair> matchingPairs;
  final int orderIndex;

  const QuestionEntity({
    required this.id,
    required this.text,
    this.imageUrl,
    required this.type,
    required this.options,
    this.matchingPairs = const [],
    required this.orderIndex,
  });

  @override
  List<Object?> get props => [id, text, imageUrl, type, options, matchingPairs, orderIndex];
}

class QuizEntity extends Equatable {
  final String id;
  final String title;
  final int passThreshold;
  final int xpMax;
  final List<QuestionEntity> questions;

  const QuizEntity({
    required this.id,
    required this.title,
    required this.passThreshold,
    required this.xpMax,
    required this.questions,
  });

  @override
  List<Object> get props => [id, title, passThreshold, xpMax, questions];
}

class QuizResult extends Equatable {
  final int score;
  final bool passed;
  final int xpEarned;
  final int attemptNumber;

  const QuizResult({
    required this.score,
    required this.passed,
    required this.xpEarned,
    required this.attemptNumber,
  });

  @override
  List<Object> get props => [score, passed, xpEarned, attemptNumber];
}
