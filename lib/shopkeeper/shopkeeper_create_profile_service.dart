import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
class ShopkeeperService {
static Future<bool> createStorekeeper(Map<String, dynamic> body)async {
  final token = LocalStorageService.getToken();
  final baseUrl = dotenv.env['BASE_URL'];
  if (token == null) {
    log.e("Token missing");
    return false;
  }
final response = await http.post(Uri.parse('$baseUrl/storekeeper/v1/profile/save'),
headers: {
"Content-Type": "application/json",
"Authorization": "Bearer $token",
},
  body: jsonEncode(body),
);
  log.d("CREATE SHOPKEEPER STATUS: ${response.statusCode}");
  log.d("CREATE SHOPKEEPER BODY: ${response.body}");
return response.statusCode == 200 ||
response.statusCode == 201;
}
}