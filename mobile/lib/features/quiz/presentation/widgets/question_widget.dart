import 'package:flutter/material.dart';
import 'package:kavabanga/features/quiz/domain/entities/quiz_entity.dart';

class QuestionWidget extends StatelessWidget {
  final QuestionEntity question;
  final dynamic selectedAnswer;
  final void Function(dynamic) onAnswer;

  const QuestionWidget({
    super.key,
    required this.question,
    required this.selectedAnswer,
    required this.onAnswer,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                question.text,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A1A),
                  height: 1.5,
                ),
              ),
              if (question.imageUrl != null && question.imageUrl!.isNotEmpty) ...[
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    question.imageUrl!,
                    fit: BoxFit.cover,
                    width: double.infinity,
                    height: 200,
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Container(
                        height: 200,
                        color: Colors.grey[200],
                        child: const Center(
                          child: CircularProgressIndicator(
                            color: Color(0xFFC8860A),
                          ),
                        ),
                      );
                    },
                    errorBuilder: (context, error, stackTrace) {
                      print('[QuestionWidget] Image load error: $error');
                      return Container(
                        height: 200,
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.image_not_supported, 
                                 size: 48, 
                                 color: Colors.grey[400]),
                            const SizedBox(height: 8),
                            Text(
                              'Изображение недоступно',
                              style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        switch (question.type) {
          QuestionType.singleChoice => _SingleChoice(
              options: question.options,
              selected: selectedAnswer as String?,
              onSelect: onAnswer,
            ),
          QuestionType.multipleChoice => _MultipleChoice(
              options: question.options,
              selected: (selectedAnswer as List<String>?) ?? [],
              onToggle: onAnswer,
            ),
          QuestionType.trueFalse => _TrueFalse(
              selected: selectedAnswer as bool?,
              onSelect: onAnswer,
            ),
          QuestionType.matching => _Matching(
              pairs: question.matchingPairs,
              selected:
                  (selectedAnswer as Map<String, String>?) ?? {},
              onMatch: onAnswer,
            ),
        },
        const SizedBox(height: 24),
      ],
    );
  }
}

class _SingleChoice extends StatelessWidget {
  final List<AnswerOption> options;
  final String? selected;
  final void Function(String) onSelect;

  const _SingleChoice(
      {required this.options, required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: options
          .map((o) => _OptionTile(
                text: o.text,
                selected: selected == o.id,
                onTap: () => onSelect(o.id),
              ))
          .toList(),
    );
  }
}

class _MultipleChoice extends StatelessWidget {
  final List<AnswerOption> options;
  final List<String> selected;
  final void Function(List<String>) onToggle;

  const _MultipleChoice(
      {required this.options,
      required this.selected,
      required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: options.map((o) {
        final isSelected = selected.contains(o.id);
        return CheckboxListTile(
          value: isSelected,
          title: Text(o.text),
          activeColor: const Color(0xFFC8860A),
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          onChanged: (_) {
            final updated = List<String>.from(selected);
            isSelected ? updated.remove(o.id) : updated.add(o.id);
            onToggle(updated);
          },
        );
      }).toList(),
    );
  }
}

class _TrueFalse extends StatelessWidget {
  final bool? selected;
  final void Function(bool) onSelect;

  const _TrueFalse({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _OptionTile(
            text: 'True',
            selected: selected == true,
            onTap: () => onSelect(true),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _OptionTile(
            text: 'False',
            selected: selected == false,
            onTap: () => onSelect(false),
          ),
        ),
      ],
    );
  }
}

class _Matching extends StatelessWidget {
  final List<MatchingPair> pairs;
  final Map<String, String> selected;
  final void Function(Map<String, String>) onMatch;

  const _Matching(
      {required this.pairs, required this.selected, required this.onMatch});

  @override
  Widget build(BuildContext context) {
    final rights = pairs.map((p) => p.right).toList()..shuffle();
    return Column(
      children: pairs.map((pair) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(pair.left),
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward, color: Colors.grey),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: selected[pair.id],
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  items: rights
                      .map((r) => DropdownMenuItem(value: r, child: Text(r)))
                      .toList(),
                  onChanged: (val) {
                    if (val == null) return;
                    final updated = Map<String, String>.from(selected)
                      ..[pair.id] = val;
                    onMatch(updated);
                  },
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final String text;
  final bool selected;
  final VoidCallback onTap;

  const _OptionTile(
      {required this.text, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFFC8860A).withOpacity(0.08) : Colors.white,
          border: Border.all(
            color: selected ? const Color(0xFFC8860A) : Colors.grey.shade200,
            width: selected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: selected
              ? [
                  BoxShadow(
                    color: const Color(0xFFC8860A).withOpacity(0.15),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  )
                ],
        ),
        child: Row(
          children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: selected ? const Color(0xFFC8860A) : Colors.transparent,
                border: Border.all(
                  color: selected ? const Color(0xFFC8860A) : Colors.grey.shade300,
                  width: 2,
                ),
              ),
              child: selected
                  ? const Icon(Icons.check, color: Colors.white, size: 14)
                  : null,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                  color: selected ? const Color(0xFF2C1810) : const Color(0xFF333333),
                  fontSize: 15,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
