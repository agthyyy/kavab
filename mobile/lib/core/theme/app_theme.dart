import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Премиальная кофейная цветовая палитра
  static const Color primaryGold = Color(0xFFC8860A);    // Насыщенная золотистая пенка (кремовый)
  static const Color primaryDark = Color(0xFF2C1810);    // Глубокий темный эспрессо
  static const Color accentOrange = Color(0xFFFF7A45);   // Теплый апельсиновый/коричный акцент
  static const Color successGreen = Color(0xFF2E7D32);   // Мягкий зеленый для правильных ответов
  static const Color backgroundLight = Color(0xFFFAF6F2); // Нежное теплое молоко/латте
  static const Color backgroundDark = Color(0xFF190F0A);  // Насыщенный черный эспрессо
  static const Color cardWhite = Color(0xFFFFFFFF);      // Чистый белый для карточек светлой темы
  static const Color cardDark = Color(0xFF2A1C16);       // Темный шоколад для карточек темной темы
  static const Color errorRed = Color(0xFFC62828);       // Красный акцент для ошибок

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryDark,
        brightness: Brightness.light,
        primary: primaryDark,
        secondary: primaryGold,
        tertiary: accentOrange,
        background: backgroundLight,
        surface: cardWhite,
        error: errorRed,
      ),
      scaffoldBackgroundColor: backgroundLight,
      textTheme: GoogleFonts.outfitTextTheme().copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          letterSpacing: -1,
          height: 1.2,
          color: primaryDark,
        ),
        displayMedium: GoogleFonts.outfit(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
          height: 1.2,
          color: primaryDark,
        ),
        displaySmall: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
          height: 1.3,
          color: primaryDark,
        ),
        headlineLarge: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
          color: primaryDark,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
          color: primaryDark,
        ),
        headlineSmall: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
          color: primaryDark,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: primaryDark,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: primaryDark,
        ),
        titleSmall: GoogleFonts.outfit(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: primaryDark,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          height: 1.5,
          color: const Color(0xFF4E3D30),
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          height: 1.5,
          color: const Color(0xFF5D4D40),
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          height: 1.4,
          color: const Color(0xFF7A6A5C),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
          shadowColor: Colors.transparent,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: primaryDark.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: primaryDark.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: errorRed, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: errorRed, width: 2),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(color: primaryDark.withOpacity(0.04), width: 1),
        ),
        color: cardWhite,
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: primaryDark,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: primaryDark,
        ),
      ),
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryGold,
        brightness: Brightness.dark,
        primary: primaryGold,
        secondary: primaryDark,
        tertiary: accentOrange,
        background: backgroundDark,
        surface: cardDark,
        error: errorRed,
      ),
      scaffoldBackgroundColor: backgroundDark,
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        displayLarge: GoogleFonts.outfit(
          fontSize: 32,
          fontWeight: FontWeight.w800,
          letterSpacing: -1,
          height: 1.2,
          color: Colors.white,
        ),
        displayMedium: GoogleFonts.outfit(
          fontSize: 28,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
          height: 1.2,
          color: Colors.white,
        ),
        displaySmall: GoogleFonts.outfit(
          fontSize: 24,
          fontWeight: FontWeight.w700,
          letterSpacing: -0.5,
          height: 1.3,
          color: Colors.white,
        ),
        headlineLarge: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
          color: Colors.white,
        ),
        headlineMedium: GoogleFonts.outfit(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.3,
          color: Colors.white,
        ),
        headlineSmall: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          letterSpacing: -0.2,
          color: Colors.white,
        ),
        titleLarge: GoogleFonts.outfit(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleSmall: GoogleFonts.outfit(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        bodyLarge: GoogleFonts.inter(
          fontSize: 16,
          fontWeight: FontWeight.normal,
          height: 1.5,
          color: const Color(0xFFD4C8C0),
        ),
        bodyMedium: GoogleFonts.inter(
          fontSize: 14,
          fontWeight: FontWeight.normal,
          height: 1.5,
          color: const Color(0xFFC0B4AC),
        ),
        bodySmall: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.normal,
          height: 1.4,
          color: const Color(0xFF9E928A),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          textStyle: GoogleFonts.outfit(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          elevation: 0,
          shadowColor: Colors.transparent,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF231813),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: Colors.white.withOpacity(0.08)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: primaryGold, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: errorRed, width: 1.5),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: errorRed, width: 2),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: BorderSide(color: Colors.white.withOpacity(0.04), width: 1),
        ),
        color: cardDark,
      ),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        titleTextStyle: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
      ),
    );
  }
}
