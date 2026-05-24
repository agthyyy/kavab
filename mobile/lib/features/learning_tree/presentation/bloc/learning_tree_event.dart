abstract class LearningTreeEvent {
  const LearningTreeEvent();
}

class LoadCourses extends LearningTreeEvent {
  const LoadCourses();
}

class LoadLearningTree extends LearningTreeEvent {
  final String courseId;
  const LoadLearningTree(this.courseId);
}

class RefreshLearningTree extends LearningTreeEvent {
  final String courseId;
  const RefreshLearningTree(this.courseId);
}
