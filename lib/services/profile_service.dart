import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/profile_model.dart';

class ProfileService {


  static Future<ProfileModel?> getProfile() async {

    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    if (token == null) {
      log.e("Token missing");
      return null;
    }
    log.d("PROFILE URL: $baseUrl/customer/v1/get/profile");
    log.d("PROFILE TOKEN: $token");
    final response = await http.get(
      Uri.parse('$baseUrl/customer/v1/get/profile'),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json"
      },
    );

    log.d("Profile Status: ${response.statusCode}");
    log.d("Profile Body: ${response.body}");

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      return ProfileModel.fromJson(data);
    }

    return null;
  }
  static Future<bool> updateProfile({
    required String name,
    required String email,
    required String dob,
    String? profileImageUrl,
  }) async {

    final token =  LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final response = await http.put(
      Uri.parse("$baseUrl/customer/v1/update"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "name": name,
        "email": email,
        "dob": dob,
        "profileImageUrl": profileImageUrl
      }),
    );

    log.d("Update Profile Status: ${response.statusCode}");
    log.d("Update Profile Body: ${response.body}");

    return response.statusCode == 200;
  }
}