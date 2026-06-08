import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/qr_model.dart';

class QRService {
  static String get baseUrl => dotenv.env['BASE_URL'] ?? "";

  // GET ALL QR
  static Future<List<QRModel>> getAllQR() async {
    final token = LocalStorageService.getToken();

    final response = await http.get(
      Uri.parse("$baseUrl/qr/v1/getAll/qrCodes"),
      headers: {"Authorization": "Bearer $token"},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      log.d("QR RESPONSE: $data");

      return List<QRModel>.from(
        data.map((e) => QRModel.fromJson(e)),
      );
    } else {
      throw Exception("Failed to fetch QR");
    }
  }

  // UPLOAD (BASE64)
  static Future<bool> uploadQR(File file) async {
    final token = LocalStorageService.getToken();

    List<int> bytes = await file.readAsBytes();
    String base64Image = base64Encode(bytes);

    final response = await http.post(
      Uri.parse("$baseUrl/qr/v1/upload"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "qrImage": base64Image,
      }),
    );

    log.d("UPLOAD RESPONSE: ${response.body}");

    return response.statusCode == 200;
  }

  // UPDATE
  static Future<bool> updateQR(String id, File file) async {
    final token = LocalStorageService.getToken();

    List<int> bytes = await file.readAsBytes();
    String base64Image = base64Encode(bytes);

    final response = await http.put(
      Uri.parse("$baseUrl/qr/v1/update/$id"),
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
      body: jsonEncode({
        "qrImage": base64Image,
      }),
    );

    return response.statusCode == 200;
  }

  // DELETE
  static Future<bool> deleteQR(String id) async {
    final token = LocalStorageService.getToken();

    final response = await http.delete(
      Uri.parse("$baseUrl/qr/v1/delete/$id"),
      headers: {"Authorization": "Bearer $token"},
    );

    return response.statusCode == 200;
  }

  // MARK DEFAULT
  static Future<bool> markDefaultQR(String id) async {
    final token = LocalStorageService.getToken();

    final response = await http.put(
      Uri.parse("$baseUrl/qr/v1/$id/default"),
      headers: {"Authorization": "Bearer $token"},
    );

    return response.statusCode == 200;
  }
}