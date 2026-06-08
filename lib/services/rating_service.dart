import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';

class RatingService {
  static Future<bool> createRating({
    required int storeKeeperId,
    required String review,
    required int rating,
  }) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final url = Uri.parse("$baseUrl/rating/v1/create");
    log.d("URL: $url");
    log.d("TOKEN: $token");
    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "storeKeeperId": storeKeeperId,
        "review": review,
        "rating": rating
      }),
    );
    log.d("RATING STATUS CODE: ${response.statusCode}");
    log.d("RATING RESPONSE: ${response.body}");
    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    } else {
      log.d("Rating API Error: ${response.body}");
      return false;
    }
  }
}