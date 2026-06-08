import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/shopkeeper_order_model.dart';

class OrderService {
  static Future<List<dynamic>> getOrderHistory({
    String? fromDate,
    String? toDate,
    String? status,
  }) async {
    final token = await LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final uri = Uri.parse("$baseUrl/orders/v1/order/history").replace(
      queryParameters: {
        if (fromDate != null) "fromDate": fromDate,
        if (toDate != null) "toDate": toDate,
        if (status != null) "status": status,
      },
    );

    final response = await http.get(
      uri,
      headers: {
        "Authorization": "Bearer $token",
        "Content-Type": "application/json",
      },
    );

    log.d("ORDER API RESPONSE: ${response.body}");
   print("ORDER RESPONSE BODY: ${response.body}");
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List list = data['orders'] ?? [];

      return list
          .map((e) => ShopkeeperOrderModel.fromJson(e))
          .toList();
    }
    else {
      throw Exception("Failed to load orders");
    }
  }
}