import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/shopkeeper_profile_model.dart';

class ShopkeeperService {

  static Future<StorekeeperModel?> getProfile() async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final response = await http.get(
      Uri.parse("$baseUrl/storekeeper/v1/get/profile"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    if (response.statusCode == 200) {
      final data =
      StorekeeperModel.fromJson(jsonDecode(response.body));
      await LocalStorageService.setStoreName(data.storeName);
      await LocalStorageService.saveStoreQrId(data.storeQrId);
      await LocalStorageService.setStoreKeeperId(data.id);

      log.d("STORE KEEPER ID SAVED: ${data.id}");

      return data;
    }

    return null;
  }

  static Future<bool> updateProfile({
    required String name,
    required String storeName,
    required String contactNumber,
    required String gstNum,
    required String storeQrId,
    required String addressLine1,
    required String addressLine2,
    required String landmark,
    required String state,
    required String city,
    required String pincode,
    required List<String> imageUrls,
  }) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final body = {
      "name": name,
      "storeName": storeName,
      "contactNumber": contactNumber,
      "gstNum": gstNum,
      "storeQrId": storeQrId,
      "addressLine1": addressLine1,
      "addressLine2": addressLine2,
      "landmark": landmark,
      "state": state,
      "city": city,
      "pincode": pincode,
      "imageUrls": imageUrls
    };

    final response = await http.put(
       Uri.parse("$baseUrl/storekeeper//v1/profile/update"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode(body),

    );

    log.d("RESPONSE: ${response.body}");

    return response.statusCode == 200;
  }
}