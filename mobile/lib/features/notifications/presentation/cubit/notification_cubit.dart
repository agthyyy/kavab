import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

part 'notification_state.dart';

/// Stub cubit — Firebase Messaging is disabled for web builds.
/// On mobile, replace with real FCM implementation.
class NotificationCubit extends Cubit<NotificationState> {
  NotificationCubit() : super(NotificationInitial());

  Future<void> initialize() async {
    // No-op for web / non-Firebase builds
    emit(NotificationDenied());
  }
}
