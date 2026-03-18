part of 'notification_cubit.dart';

abstract class NotificationState extends Equatable {
  const NotificationState();
  @override
  List<Object?> get props => [];
}

class NotificationInitial extends NotificationState {}

class NotificationReady extends NotificationState {}

class NotificationDenied extends NotificationState {}

class NotificationReceived extends NotificationState {
  final String title;
  final String body;
  const NotificationReceived({required this.title, required this.body});
  @override
  List<Object?> get props => [title, body];
}
