import 'package:equatable/equatable.dart';

class CourseEntity extends Equatable {
  final String id;
  final String title;
  final String description;
  final bool isPublished;
  final DateTime createdAt;

  const CourseEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.isPublished,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [id, title, description, isPublished, createdAt];
}
