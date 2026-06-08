import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';

class AuthService {
  static final String baseUrl = dotenv.env['BASE_URL']!;

  static Future<bool> sendOtp(String mobile) async {
    try{

      log.d("Calling URL: $baseUrl/otp/v1/otp/send/login");

    final response = await http.post(
    Uri.parse('$baseUrl/otp/v1/otp/send/login'),
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "mobileNumber": mobile,
        "roles": "role"
      }),
    );



    log.d("Send OTP Status Code: ${response.statusCode}");
    log.d("Send OTP Body: ${response.body}");
   if(response.statusCode == 200) {
     final decoded = jsonDecode(response.body);
     log.d("Decoded: $decoded");
     return true;
   }
   else {
     log.e("API failed with status: ${response.statusCode}");
     return false;
   }
   } catch (e) {
      log.e("FULL ERROR: $e");
      rethrow;
    }
  }
  static Future<Map<String, dynamic>> verifyLogin({
    required String mobile,
    required String firebaseToken,
    required String? deviceToken,
  }) async {

    log.d("Calling VERIFY LOGIN API...");

    final response = await http.post(
      Uri.parse('$baseUrl/otp/v1/otp/verify/login'),
      headers: {
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "mobileNumber": mobile,
        "firebaseToken": firebaseToken,
        "deviceToken": deviceToken,
      }),
    );

    log.d("Verify Login Status: ${response.statusCode}");
    log.d("Verify Login Body: ${response.body}");

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception("Login verification failed");
    }
  }

  Future<Map<String, dynamic>> login(String mobile, String otp) async {
    if (otp != "1111") {
      return {"status": 400};
    }
    final bool isProfileCompleted =
        LocalStorageService.getProfileCompleted() ;

    if (!isProfileCompleted) {
      return {
        "firstTimeLogin": 1501,
        "userId": mobile,
      };
    } else {
      return {
        "firstTimeLogin": 1502,
        "userId": mobile,
      };
    }
  }
  static Future<void> saveLoginSession({
    required Map<String, dynamic> response,
    required String role,
    required String phone,
  }) async {

    final int userId = response["userId"];
    final String token = response["token"];
    log.d("TOKEN BEFORE SAVING: $token");
    LocalStorageService.setToken(token);
    log.d("TOKEN AFTER SAVING: ${LocalStorageService.getToken()}");

    LocalStorageService.setUserId(userId);
    LocalStorageService.setRole(role);
    LocalStorageService.setLoggedIn(true);
     LocalStorageService.setPhone(phone);

    log.i("Saved Phone: $phone");
  }

}