import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';

class CustomerService {

  static Future<bool> createCustomer(Map<String, dynamic> body) async {

    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    if (token == null) {
      log.e("Token missing");
      return false;
    }

    log.d("CREATE CUSTOMER REQUEST: ${jsonEncode(body)}");

    final response = await http.post(
      Uri.parse('$baseUrl/customer/v1/create'),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json"
      },
      body: jsonEncode(body),
    );

    log.d("CREATE CUSTOMER STATUS: ${response.statusCode}");
    log.d("CREATE CUSTOMER BODY: ${response.body}");

    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    }

    return false;
  }

}