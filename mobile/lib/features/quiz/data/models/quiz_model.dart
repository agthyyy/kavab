import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';

class QuizModel {
  static QuizEntity fromJson(Map<String, dynamic> json) {
    print('[QuizModel] Parsing quiz from JSON...');
    // Backend returns { quiz: {...}, questions: [...] }
    final quizData = json['quiz'] as Map<String, dynamic>? ?? json;
    final questionsData = json['questions'] as List<dynamic>? ?? [];
    
    print('[QuizModel] Quiz data: $quizData');
    print('[QuizModel] Questions count: ${questionsData.length}');
    
    final questions = questionsData
        .map((q) => _parseQuestion(q as Map<String, dynamic>))
        .toList();

    final id = quizData['id'] as String? ?? '';
    final title = quizData['title'] as String? ?? 'Тест'; // Default title if not provided
    final passThreshold = quizData['passThreshold'] as int? ?? quizData['pass_threshold'] as int? ?? 70;
    final xpMax = quizData['xpMax'] as int? ?? quizData['xp_max'] as int? ?? 100;
    
    print('[QuizModel] Parsed quiz: id=$id, title=$title, questions=${questions.length}');

    return QuizEntity(
      id: id,
      title: title,
      passThreshold: passThreshold,
      xpMax: xpMax,
      questions: questions,
    );
  }

  static QuestionEntity _parseQuestion(Map<String, dynamic> q) {
    print('[QuizModel] Parsing question: ${q['id']}');
    final typeStr = q['questionType'] as String? ?? q['question_type'] as String? ?? 'single';
    final type = _parseType(typeStr);

    final options = (q['options'] as List<dynamic>? ?? q['answer_options'] as List<dynamic>? ?? [])
        .map((o) => _parseOption(o as Map<String, dynamic>))
        .toList();

    final pairs = (q['matching_pairs'] as List<dynamic>? ?? [])
        .map((p) => _parsePair(p as Map<String, dynamic>))
        .toList();

    final id = q['id'] as String? ?? '';
    final text = q['text'] as String? ?? '';
    final imageUrlRaw = q['imageUrl'] as String? ?? q['image_url'] as String?;
    final imageUrl = (imageUrlRaw?.isEmpty ?? true) ? null : imageUrlRaw;
    final orderIndex = q['orderIndex'] as int? ?? q['order_index'] as int? ?? 0;
    
    print('[QuizModel] Parsed question: id=$id, text=$text, options=${options.length}');

    return QuestionEntity(
      id: id,
      text: text,
      imageUrl: imageUrl,
      type: type,
      options: options,
      matchingPairs: pairs,
      orderIndex: orderIndex,
    );
  }

  static QuestionType _parseType(String t) => switch (t) {
        'multiple' => QuestionType.multipleChoice,
        'multiple_choice' => QuestionType.multipleChoice,
        'matching' => QuestionType.matching,
        'true_false' => QuestionType.trueFalse,
        'single' => QuestionType.singleChoice,
        _ => QuestionType.singleChoice,
      };

  static AnswerOption _parseOption(Map<String, dynamic> o) {
    print('[QuizModel] Parsing option: ${o['id']}');
    final id = o['id'] as String? ?? '';
    final text = o['text'] as String? ?? '';
    print('[QuizModel] Option parsed: id=$id, text=$text');
    
    return AnswerOption(
      id: id,
      text: text,
      isCorrect: false, // Users shouldn't see correct answers before submitting
      explanation: o['explanation'] as String?,
    );
  }

  static MatchingPair _parsePair(Map<String, dynamic> p) => MatchingPair(
        id: p['id'] as String? ?? '',
        left: p['left'] as String? ?? '',
        right: p['right'] as String? ?? '',
      );

  static QuizResult resultFromJson(Map<String, dynamic> json) {
    return QuizResult(
      score: json['score'] as int,
      passed: json['passed'] as bool,
      xpEarned: json['xpAwarded'] as int? ?? 0,
      attemptNumber: json['attemptNumber'] as int? ?? 1,
    );
  }
}
