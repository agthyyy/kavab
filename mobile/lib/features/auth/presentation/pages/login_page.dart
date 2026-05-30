import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_cubit.dart';
import 'package:kavabanga/features/auth/presentation/cubit/auth_state.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<AuthCubit, AuthState>(
        listener: (context, state) {
          if (state is AuthAuthenticated) {
            Navigator.of(context).pushReplacementNamed('/home');
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: const Color(0xFFC62828),
                behavior: SnackBarBehavior.floating,
                margin: const EdgeInsets.all(20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            );
          }
        },
        builder: (context, state) {
          final isLoading = state is AuthLoading;

          return Stack(
            children: [
              // Богатый кофейный градиент на фоне
              Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Color(0xFF160A06), // Глубокий темный
                      Color(0xFF2C1810), // Эспрессо
                      Color(0xFF42271D), // Теплый какао
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
              // Декоративные размытые световые круги для премиального вида
              Positioned(
                top: -50,
                right: -50,
                child: Container(
                  width: 250,
                  height: 250,
                  decoration: BoxDecoration(
                    color: const Color(0xFFC8860A).withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 50.0, sigmaY: 50.0),
                    child: Container(color: Colors.transparent),
                  ),
                ),
              ),
              Positioned(
                bottom: -80,
                left: -80,
                child: Container(
                  width: 300,
                  height: 300,
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF7A45).withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: BackdropFilter(
                    filter: ui.ImageFilter.blur(sigmaX: 60.0, sigmaY: 60.0),
                    child: Container(color: Colors.transparent),
                  ),
                ),
              ),
              
              // Основной контент
              SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 400),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Логотип
                          SvgPicture.asset(
                            'assets/images/logo.svg',
                            height: 80,
                            colorFilter: const ColorFilter.mode(
                              Color(0xFFE2B275), // Золотистый оттенок пенки
                              BlendMode.srcIn,
                            ),
                          ),
                          const SizedBox(height: 48),

                          // Стеклянная карточка с формой входа (Glassmorphism)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(28),
                            child: BackdropFilter(
                              filter: ui.ImageFilter.blur(sigmaX: 16.0, sigmaY: 16.0),
                              child: Container(
                                padding: const EdgeInsets.all(32),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(28),
                                  border: Border.all(
                                    color: Colors.white.withOpacity(0.12),
                                    width: 1.5,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.stretch,
                                  children: [
                                    _buildGlassField(
                                      controller: _emailController,
                                      label: 'ЛОГИН',
                                      hint: 'Ваш логин',
                                      icon: Icons.person_outline_rounded,
                                      enabled: !isLoading,
                                    ),
                                    const SizedBox(height: 24),
                                    _buildGlassField(
                                      controller: _passwordController,
                                      label: 'ПАРОЛЬ',
                                      hint: '••••••••',
                                      icon: Icons.lock_outline_rounded,
                                      obscureText: _obscurePassword,
                                      enabled: !isLoading,
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _obscurePassword
                                              ? Icons.visibility_outlined
                                              : Icons.visibility_off_outlined,
                                          color: Colors.white.withOpacity(0.5),
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _obscurePassword = !_obscurePassword;
                                          });
                                        },
                                      ),
                                    ),
                                    const SizedBox(height: 36),

                                    // Премиальная кнопка со свечением и градиентом
                                    Container(
                                      decoration: BoxDecoration(
                                        borderRadius: BorderRadius.circular(30),
                                        boxShadow: [
                                          BoxShadow(
                                            color: const Color(0xFFC8860A).withOpacity(0.3),
                                            blurRadius: 20,
                                            offset: const Offset(0, 8),
                                          ),
                                        ],
                                      ),
                                      child: ElevatedButton(
                                        onPressed: isLoading ? null : _handleLogin,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.transparent,
                                          shadowColor: Colors.transparent,
                                          padding: EdgeInsets.zero,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(30),
                                          ),
                                        ).copyWith(
                                          // Добавляем градиент кнопке
                                          backgroundColor: MaterialStateProperty.resolveWith<Color>((states) {
                                            if (states.contains(MaterialState.disabled)) {
                                              return const Color(0xFFC8860A).withOpacity(0.4);
                                            }
                                            return Colors.transparent; // Обрабатываем через контейнер/декорацию
                                          }),
                                        ),
                                        child: Ink(
                                          decoration: BoxDecoration(
                                            gradient: const LinearGradient(
                                              colors: [Color(0xFFC8860A), Color(0xFFE2B275)],
                                              begin: Alignment.centerLeft,
                                              end: Alignment.centerRight,
                                            ),
                                            borderRadius: BorderRadius.circular(30),
                                          ),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(vertical: 22),
                                            alignment: Alignment.center,
                                            child: isLoading
                                                ? const SizedBox(
                                                    height: 20,
                                                    width: 20,
                                                    child: CircularProgressIndicator(
                                                      strokeWidth: 2,
                                                      valueColor: AlwaysStoppedAnimation<Color>(
                                                        Colors.white,
                                                      ),
                                                    ),
                                                  )
                                                : Text(
                                                    'Войти в систему',
                                                    style: GoogleFonts.outfit(
                                                      fontSize: 22,
                                                      fontWeight: FontWeight.w800,
                                                      color: Colors.white,
                                                      letterSpacing: 1.0,
                                                    ),
                                                  ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          
                          const SizedBox(height: 32),
                          Text(
                            'Kavabanga Learning Platform v1.0',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: Colors.white.withOpacity(0.3),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildGlassField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    bool enabled = true,
    Widget? suffixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.outfit(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: const Color(0xFFE2B275),
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: obscureText,
          enabled: enabled,
          style: GoogleFonts.inter(
            fontSize: 16,
            color: Colors.white,
          ),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(
              color: Colors.white.withOpacity(0.35),
            ),
            prefixIcon: Icon(
              icon,
              color: const Color(0xFFE2B275),
              size: 20,
            ),
            suffixIcon: suffixIcon,
            filled: true,
            fillColor: Colors.white.withOpacity(0.04),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
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
              borderSide: const BorderSide(color: Color(0xFFE2B275), width: 2),
            ),
          ),
        ),
      ],
    );
  }

  void _handleLogin() {
    final login = _emailController.text.trim();
    final password = _passwordController.text;

    if (login.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Пожалуйста, заполните все поля'),
          backgroundColor: const Color(0xFFC62828),
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.all(20),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
        ),
      );
      return;
    }

    context.read<AuthCubit>().login(login, password);
  }
}
