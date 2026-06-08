import 'dart:convert';
import 'package:codemonks_nukkad/customer/customer_order_model.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';

class OrderService {

  Future<List<CustomerOrderModel>> getOrderHistory() async {
    final token = await LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final response = await http.get(
      Uri.parse("$baseUrl/orders/v1/order/history"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
    );
    log.d("Order Status Code: ${response.statusCode}");
    log.d("Order Body: ${response.body}");
    if (response.statusCode == 200) {

      final decoded = jsonDecode(response.body);

      final List list = decoded['orders'];

      return list.map((e) => CustomerOrderModel.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load orders");
    }
  }
}