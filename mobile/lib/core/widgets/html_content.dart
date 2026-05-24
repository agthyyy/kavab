import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';

class HtmlContent extends StatelessWidget {
  final String htmlData;
  final TextStyle? defaultTextStyle;

  const HtmlContent({
    Key? key,
    required this.htmlData,
    this.defaultTextStyle,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Если контент не содержит HTML тегов, отображаем как обычный текст
    if (!htmlData.contains('<') || !htmlData.contains('>')) {
      return Text(
        htmlData,
        style: defaultTextStyle ?? Theme.of(context).textTheme.bodyMedium,
      );
    }

    return Html(
      data: htmlData,
      style: {
        "body": Style(
          margin: Margins.zero,
          padding: HtmlPaddings.zero,
          fontSize: FontSize(defaultTextStyle?.fontSize ?? 14),
          color: defaultTextStyle?.color ?? Theme.of(context).textTheme.bodyMedium?.color,
          fontFamily: defaultTextStyle?.fontFamily,
        ),
        "p": Style(
          margin: Margins.only(bottom: 8),
        ),
        "h1": Style(
          fontSize: FontSize(24),
          fontWeight: FontWeight.bold,
          margin: Margins.only(bottom: 12, top: 8),
        ),
        "h2": Style(
          fontSize: FontSize(20),
          fontWeight: FontWeight.bold,
          margin: Margins.only(bottom: 10, top: 6),
        ),
        "h3": Style(
          fontSize: FontSize(18),
          fontWeight: FontWeight.bold,
          margin: Margins.only(bottom: 8, top: 4),
        ),
        "strong": Style(
          fontWeight: FontWeight.bold,
        ),
        "b": Style(
          fontWeight: FontWeight.bold,
        ),
        "em": Style(
          fontStyle: FontStyle.italic,
        ),
        "i": Style(
          fontStyle: FontStyle.italic,
        ),
        "u": Style(
          textDecoration: TextDecoration.underline,
        ),
        "ul": Style(
          margin: Margins.only(bottom: 8),
        ),
        "ol": Style(
          margin: Margins.only(bottom: 8),
        ),
        "li": Style(
          margin: Margins.only(bottom: 4),
        ),
      },
    );
  }
}