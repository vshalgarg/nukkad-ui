import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/address_model.dart';

class AddressService {
  static Future<AddressModel?> createAddress(Map<String, dynamic> body) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    log.d("createAddress called");
    if (token == null) {
      log.e("Token missing");
      return null;
    }

    final customerId = LocalStorageService.getUserId();
    body["customerId"] = customerId;
    log.d("Request body: $body");

    final response = await http.post(
      Uri.parse('$baseUrl/addresses/v1/create'),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode(body),
    );

    log.d("CREATE Address: ${response.statusCode}");
    log.d("CREATE Address BODY: ${response.body}");

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      log.i("Address created successfully");
      return AddressModel.fromJson(data);
    }
    log.e("Create address failed");
    return null;
  }

  static Future<List<AddressModel>> getAddresses() async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final response = await http.get(
      Uri.parse('$baseUrl/addresses/v1/get'),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json"
      },
    );
    log.d("GET ADDRESS: ${response.statusCode}");
    log.d("GET ADDRESS BODY: ${response.body}");
    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      log.i("Addresses fetched: ${data.length}");
      return data.map((e) => AddressModel.fromJson(e)).toList();
    } else {
      log.e("Failed to load addresses");
      throw Exception("Failed to load addresses:${response.body}");
    }
  }

  static Future<AddressModel?> updateAddress(int id,
      Map<String, dynamic> body,) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final response = await http.put(
      Uri.parse("$baseUrl/addresses/v1/address/$id"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: jsonEncode(body),
    );
    log.d("UPDATE ADDRESS: ${response.statusCode}");
    log.d("UPDATE ADDRESS Body: ${response.body}");
    if (response.statusCode == 200) {
      log.i("Address updated successfully");
      final data = jsonDecode(response.body);
      return AddressModel.fromJson(data);
    }
    log.e("Update address failed");
    return null;
  }

  static Future<bool> markDefaultAddress(int id) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final response = await http.put(
      Uri.parse("$baseUrl/addresses/v1/address/$id/mark-default"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    log.d("MARK DEFAULT STATUS: ${response.statusCode}");
    log.d("MARK DEFAULT BODY: ${response.body}");

    if (response.statusCode == 200) {
      log.i("Default address updated");
      return true;
    }

    log.e("Mark default failed");
    return false;
  }

  static Future<bool> deleteAddress(int id) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final response = await http.delete(
      Uri.parse("$baseUrl/addresses/v1/address/$id/delete"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    log.d("DELETE ADDRESS STATUS: ${response.statusCode}");
    log.d("DELETE ADDRESS BODY: ${response.body}");
    if (response.statusCode == 200 || response.statusCode == 204) {
      log.i("Address deleted successfully");
      return true;
    }

    log.e("Delete address failed");
    return false;
  }
}
