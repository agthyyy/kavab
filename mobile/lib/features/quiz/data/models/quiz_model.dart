import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';

class QuizModel {
  static QuizEntity fromJson(Map<String, dynamic> json) {
    final questions = (json['questions'] as List<dynamic>? ?? [])
        .map((q) => _parseQuestion(q as Map<String, dynamic>))
        .toList();

    return QuizEntity(
      id: json['id'] as String,
      title: json['title'] as String,
      passThreshold: json['pass_threshold'] as int? ?? 70,
      xpMax: json['xp_max'] as int? ?? 100,
      questions: questions,
    );
  }

  static QuestionEntity _parseQuestion(Map<String, dynamic> q) {
    final typeStr = q['question_type'] as String? ?? 'single_choice';
    final type = _parseType(typeStr);

    final options = (q['answer_options'] as List<dynamic>? ?? [])
        .map((o) => _parseOption(o as Map<String, dynamic>))
        .toList();

    final pairs = (q['matching_pairs'] as List<dynamic>? ?? [])
        .map((p) => _parsePair(p as Map<String, dynamic>))
        .toList();

    return QuestionEntity(
      id: q['id'] as String,
      text: q['text'] as String,
      type: type,
      options: options,
      matchingPairs: pairs,
      orderIndex: q['order_index'] as int? ?? 0,
    );
  }

  static QuestionType _parseType(String t) => switch (t) {
        'multiple_choice' => QuestionType.multipleChoice,
        'matching' => QuestionType.matching,
        'true_false' => QuestionType.trueFalse,
        _ => QuestionType.singleChoice,
      };

  static AnswerOption _parseOption(Map<String, dynamic> o) => AnswerOption(
        id: o['id'] as String,
        text: o['text'] as String,
        isCorrect: o['is_correct'] as bool? ?? false,
        explanation: o['explanation'] as String?,
      );

  static MatchingPair _parsePair(Map<String, dynamic> p) => MatchingPair(
        id: p['id'] as String,
        left: p['left'] as String,
        right: p['right'] as String,
      );

  static QuizResult resultFromJson(Map<String, dynamic> json) {
    final wrong = (json['wrong_answers'] as List<dynamic>? ?? [])
        .map((w) => WrongAnswer(
              questionText: w['question_text'] as String,
              correctAnswer: w['correct_answer'] as String,
              explanation: w['explanation'] as String?,
            ))
        .toList();

    return QuizResult(
      score: json['score'] as int,
      passed: json['passed'] as bool,
      xpEarned: json['xp_earned'] as int? ?? 0,
      wrongAnswers: wrong,
    );
  }
}
