import 'dart:convert';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
class OrderApiService {
  static const String baseUrl = "http://192.168.1.100/nukkad/api";

  static Future<bool> updateOrderStatus({
    required int orderId,
    required String status,
  }) async {
    final url = Uri.parse(
      "$baseUrl/orders/v1/order/updateByStatus/$orderId",
    );

    final body = {
      "orderStatus": status,
    };

    try {
      final response = await http.patch(
        url,
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonEncode(body),
      );

      log.d("Status Code: ${response.statusCode}");
      log.d("Response: ${response.body}");

      if (response.statusCode == 200) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      log.e("API Error: $e");
      return false;
    }
  }
}