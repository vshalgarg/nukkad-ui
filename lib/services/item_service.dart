 import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
 import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/item_model.dart';
class ItemService {
static Future<List<ItemModel>> getItemsByCategory(int id) async {
  final token = LocalStorageService.getToken();
  final baseUrl = dotenv.env['BASE_URL'];

  final response = await http.get(
    Uri.parse('$baseUrl/item/v1/get_by_category/$id'),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    },
  );

  log.d("Items Status Code: ${response.statusCode}");
  log.d("Items Body: ${response.body}");

  if (response.statusCode == 200) {
    final decoded = jsonDecode(response.body);

    final List<dynamic> itemsList = decoded["items"];

    return itemsList.map((json) => ItemModel.fromJson(json))
        .toList();
  } else {
    throw Exception("Failed to load items");
  }
}
  static Future<List<ItemModel>> searchItems(String keyword) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    log.d("Search token: $token");
    log.d("Search keyword: $keyword");
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/search/v1/get?keyword=$keyword"),
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer $token",
          });
      log.d("Search Status Code: ${response.statusCode}");
      log.d("Search Body: ${response.body}");
      if (response.statusCode == 200) {
        final decoded = json.decode(response.body);
        final List<dynamic> itemsList = decoded["items"]??[];

        return itemsList
            .map((json) => ItemModel.fromJson(json))
            .toList();
      } else {
        throw Exception("Failed to search items");
      }
    } catch (e) {
      throw Exception("Search API Error: $e");
    }
  }
}