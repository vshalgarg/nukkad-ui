import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/category_model.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class CategoryService {

  static Future<List<CategoryModel>> getAllCategories() async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    log.d("CATEGORY TOKEN USED: $token");
    if (token == null || token.isEmpty) {
      throw Exception("Token is missing");
    }
    final response = await http.get(
      Uri.parse('$baseUrl/category/v1/get'),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    log.d("Status Code: ${response.statusCode}");
    log.d("Body: ${response.body}");
    if (response.statusCode == 200) {
      final List<dynamic> decoded = jsonDecode(response.body);
      return decoded
          .map((json) => CategoryModel.fromJson(json))
          .toList();
    } else {
      throw Exception("Failed to load categories");
    }
  }
}