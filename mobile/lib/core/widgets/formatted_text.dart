import 'package:flutter/material.dart';

class FormattedText extends StatelessWidget {
  final String text;
  final TextStyle? baseStyle;

  const FormattedText({
    super.key,
    required this.text,
    this.baseStyle,
  });

  @override
  Widget build(BuildContext context) {
    return RichText(
      text: _parseText(text, baseStyle ?? const TextStyle(fontSize: 16, height: 1.6)),
    );
  }

  TextSpan _parseText(String text, TextStyle baseStyle) {
    final List<TextSpan> spans = [];
    final RegExp pattern = RegExp(r'\*\*(.*?)\*\*|\*(.*?)\*|`(.*?)`');
    int lastEnd = 0;

    for (final match in pattern.allMatches(text)) {
      // Add text before the match
      if (match.start > lastEnd) {
        spans.add(TextSpan(
          text: text.substring(lastEnd, match.start),
          style: baseStyle,
        ));
      }

      // Add formatted text
      if (match.group(1) != null) {
        // Bold text **text**
        spans.add(TextSpan(
          text: match.group(1),
          style: baseStyle.copyWith(
            fontWeight: FontWeight.bold,
            color: const Color(0xFF2C1810),
          ),
        ));
      } else if (match.group(2) != null) {
        // Italic text *text*
        spans.add(TextSpan(
          text: match.group(2),
          style: baseStyle.copyWith(
            fontStyle: FontStyle.italic,
            color: const Color(0xFF4A4A4A),
          ),
        ));
      } else if (match.group(3) != null) {
        // Code text `text`
        spans.add(TextSpan(
          text: match.group(3),
          style: baseStyle.copyWith(
            fontFamily: 'monospace',
            backgroundColor: const Color(0xFFF5F0EB),
            color: const Color(0xFFC8860A),
            fontSize: (baseStyle.fontSize ?? 16) - 1,
          ),
        ));
      }

      lastEnd = match.end;
    }

    // Add remaining text
    if (lastEnd < text.length) {
      spans.add(TextSpan(
        text: text.substring(lastEnd),
        style: baseStyle,
      ));
    }

    return TextSpan(children: spans);
  }
}