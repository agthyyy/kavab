abstract class LearningTreeEvent {
  const LearningTreeEvent();
}

class LoadLearningTree extends LearningTreeEvent {
  final String courseId;
  const LoadLearningTree(this.courseId);
}

class RefreshLearningTree extends LearningTreeEvent {
  final String courseId;
  const RefreshLearningTree(this.courseId);
}
