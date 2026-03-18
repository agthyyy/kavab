extension StringExtensions on String {
  String capitalize() {
    if (isEmpty) return this;
    return '${this[0].toUpperCase()}${substring(1)}';
  }

  bool get isBlank => trim().isEmpty;
  bool get isNotBlank => trim().isNotEmpty;
}

extension NullableStringExtensions on String? {
  bool get isNullOrBlank => this == null || this!.trim().isEmpty;
}

extension IntExtensions on int {
  String toXpString() => '+$this XP';
}
