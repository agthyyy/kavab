class ApiConstants {
  static const String baseUrl = 'http://localhost:3000/api';
  static const String login = '/auth/login';
  static const String refresh = '/auth/refresh';
  static const String logout = '/auth/logout';
  static const String courses = '/content/courses';
  static const String courseTree = '/content/courses/{id}/tree';
  static const String lesson = '/content/lessons/{id}';
  static const String quiz = '/content/quizzes/{id}';
  static const String completeLesson = '/progress/lessons/{id}/complete';
  static const String submitQuiz = '/progress/quizzes/{id}/submit';
  static const String progressMe = '/progress/me';
  static const String achievements = '/progress/me/achievements';
  static const String xpHistory = '/progress/me/xp-history';
  static const String fcmToken = '/notifications/token';
  static const String rankingMe = '/ranking/me';
  static const String rankingLeaderboard = '/ranking/leaderboard';
}
