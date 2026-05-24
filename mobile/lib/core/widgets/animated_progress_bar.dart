import 'package:flutter/material.dart';
import 'dart:math' as math;

class AnimatedProgressBar extends StatefulWidget {
  final double value;
  final double height;
  final Color backgroundColor;
  final Gradient gradient;
  final Duration duration;
  final bool showParticles;

  const AnimatedProgressBar({
    super.key,
    required this.value,
    this.height = 12,
    this.backgroundColor = const Color(0xFFE0E0E0),
    this.gradient = const LinearGradient(
      colors: [Color(0xFF6366F1), Color(0xFFD4AF37)],
    ),
    this.duration = const Duration(milliseconds: 800),
    this.showParticles = true,
  });

  @override
  State<AnimatedProgressBar> createState() => _AnimatedProgressBarState();
}

class _AnimatedProgressBarState extends State<AnimatedProgressBar>
    with TickerProviderStateMixin {
  late AnimationController _progressController;
  late AnimationController _particleController;
  late Animation<double> _progressAnimation;
  final List<Particle> _particles = [];

  @override
  void initState() {
    super.initState();
    _progressController = AnimationController(
      duration: widget.duration,
      vsync: this,
    );
    _particleController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    )..repeat();

    _progressAnimation = Tween<double>(begin: 0, end: widget.value).animate(
      CurvedAnimation(parent: _progressController, curve: Curves.easeOutCubic),
    );

    _progressController.forward();

    if (widget.showParticles) {
      _generateParticles();
    }
  }

  void _generateParticles() {
    final random = math.Random();
    for (int i = 0; i < 8; i++) {
      _particles.add(Particle(
        x: random.nextDouble(),
        y: random.nextDouble(),
        size: random.nextDouble() * 3 + 2,
        speed: random.nextDouble() * 0.5 + 0.3,
      ));
    }
  }

  @override
  void didUpdateWidget(AnimatedProgressBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value) {
      _progressAnimation = Tween<double>(
        begin: _progressAnimation.value,
        end: widget.value,
      ).animate(
        CurvedAnimation(parent: _progressController, curve: Curves.easeOutCubic),
      );
      _progressController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _progressController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(widget.height / 2),
      child: SizedBox(
        height: widget.height,
        child: Stack(
          children: [
            // Background
            Container(
              decoration: BoxDecoration(
                color: widget.backgroundColor,
                borderRadius: BorderRadius.circular(widget.height / 2),
              ),
            ),
            // Progress with particles
            AnimatedBuilder(
              animation: Listenable.merge([_progressAnimation, _particleController]),
              builder: (context, child) {
                return CustomPaint(
                  painter: ProgressPainter(
                    progress: _progressAnimation.value,
                    gradient: widget.gradient,
                    particles: widget.showParticles ? _particles : [],
                    particleAnimation: _particleController.value,
                  ),
                  size: Size.infinite,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class Particle {
  double x;
  double y;
  final double size;
  final double speed;

  Particle({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
  });
}

class ProgressPainter extends CustomPainter {
  final double progress;
  final Gradient gradient;
  final List<Particle> particles;
  final double particleAnimation;

  ProgressPainter({
    required this.progress,
    required this.gradient,
    required this.particles,
    required this.particleAnimation,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final progressWidth = size.width * progress.clamp(0.0, 1.0);

    // Draw progress bar
    final rect = Rect.fromLTWH(0, 0, progressWidth, size.height);
    final paint = Paint()..shader = gradient.createShader(rect);
    canvas.drawRRect(
      RRect.fromRectAndRadius(rect, Radius.circular(size.height / 2)),
      paint,
    );

    // Draw particles
    if (particles.isNotEmpty && progress > 0) {
      final particlePaint = Paint()
        ..color = Colors.white.withOpacity(0.6)
        ..style = PaintingStyle.fill;

      for (var particle in particles) {
        final x = (particle.x + particleAnimation * particle.speed) % 1.0;
        final y = particle.y;
        
        if (x * size.width <= progressWidth) {
          canvas.drawCircle(
            Offset(x * progressWidth, y * size.height),
            particle.size,
            particlePaint,
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(ProgressPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.particleAnimation != particleAnimation;
  }
}
