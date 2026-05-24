import 'package:kavabanga/core/network/api_client.dart';
import 'package:kavabanga/core/network/api_constants.dart';

abstract class GamificationRemoteDataSource {
  Future<Map<String, dynamic>> getGamificationOverview();
  Future<List<dynamic>> getDailyQuests();
  Future<List<dynamic>> getUserTitles();
  Future<Map<String, dynamic>> getUserEnergy();
  Future<List<dynamic>> getUserCards();
  Future<void> setActiveTitle(String titleId);
}

class GamificationRemoteDataSourceImpl implements GamificationRemoteDataSource {
  final ApiClient apiClient;
  GamificationRemoteDataSourceImpl({required this.apiClient});

  @override
  Future<Map<String, dynamic>> getGamificationOverview() async {
    final response = await apiClient.get('/api/gamification/overview');
    return response.data as Map<String, dynamic>;
  }

  @override
  Future<List<dynamic>> getDailyQuests() async {
    final response = await apiClient.get('/api/gamification/daily-quests');
    final data = response.data as Map<String, dynamic>;
    return data['quests'] as List<dynamic>;
  }

  @override
  Future<List<dynamic>> getUserTitles() async {
    final response = await apiClient.get('/api/gamification/titles');
    final data = response.data as Map<String, dynamic>;
    return data['titles'] as List<dynamic>;
  }

  @override
  Future<Map<String, dynamic>> getUserEnergy() async {
    final response = await apiClient.get('/api/gamification/energy');
    final data = response.data as Map<String, dynamic>;
    return data['energy'] as Map<String, dynamic>;
  }

  @override
  Future<List<dynamic>> getUserCards() async {
    final response = await apiClient.get('/api/gamification/cards');
    final data = response.data as Map<String, dynamic>;
    return data['cards'] as List<dynamic>;
  }

  @override
  Future<void> setActiveTitle(String titleId) async {
    await apiClient.post('/api/gamification/titles/activate', data: {
      'titleId': titleId,
    });
  }
}
