import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../models/store_model.dart';
import '../db/local_storage.dart';

class StoreService {
  static Future<StoreModel?> addStore(String storeQrId) async {
try {
  final token = LocalStorageService.getToken();
  final baseUrl = dotenv.env['BASE_URL'];
  final url = Uri.parse(
      "$baseUrl/customer/v1/add/store?storeQrId=$storeQrId"
  );

  final response = await http.post(
    url,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token",
    },
  );

  log.d("Store Status Code: ${response.statusCode}");
  log.d("Store Body: ${response.body}");
  log.d("StoreQrId:$storeQrId");
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    int storeId = data["storekeeperId"] ?? 0;
    String storeName = data["storeName"] ?? "Unknown Store";
    if (storeId != 0) {
      await LocalStorageService.saveStoreId(storeId);
      await LocalStorageService.setStoreName(storeName);
      await LocalStorageService.saveStoreQrId(storeId.toString());
      return StoreModel.fromJson(data);
    }
  }  return null;
  }
catch (e) {
  log.e("Add Store Error: $e");
  return null;
}}
  // GET MY STORES
  static Future<List<StoreModel>> getMyStores() async {

    final token =  LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final url = Uri.parse(
        "$baseUrl/customer/v1/myStores");

    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    log.d("MyStores Status: ${response.statusCode}");
    log.d("MyStores Body: ${response.body}");

    if (response.statusCode == 200) {

      final List decoded = jsonDecode(response.body);

      return decoded
          .map((e) => StoreModel.fromJson(e))
          .toList();
    }

    return [];
  }
}