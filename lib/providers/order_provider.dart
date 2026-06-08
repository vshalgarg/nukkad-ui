import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../db/local_storage.dart';
import '../common/logger.dart';
import '../models/order_model.dart';
import '../services/order_service.dart' as OrderService;

class OrderProvider extends ChangeNotifier {
  List<OrderModel> orders = [];
  bool isLoading = false;
  String currentStatus = "PENDING";
  int pendingCount = 0;
  int inProgressCount = 0;
  int deliveredCount = 0;

  Future<void> fetchOrders(String status) async {
    currentStatus = status;
    isLoading = true;
    notifyListeners();

    try {
      final response = await OrderService.getOrdersRaw(status);
      log.d("FULL RESPONSE: $response");
      log.d("ORDERS DATA: ${response['orders']}");
      orders = (response['orders'] as List)
          .map((e) => OrderModel.fromJson(e))
          .toList();
      log.i("ORDERS LENGTH: ${orders.length}");
      if (status == "PENDING") pendingCount = orders.length;
      if (status == "IN_PROGRESS") inProgressCount = orders.length;
      if (status == "DELIVERED") deliveredCount = orders.length;
      log.i("Orders loaded: ${orders.length}");
    } catch (e) {
      log.e("ERROR: $e");
    }

    isLoading = false;
    notifyListeners();
  }
  Future<List<OrderModel>> getOrders(String status) async {
    final token = await LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final response = await http.get(
      Uri.parse(
        "$baseUrl/orders/v1/order/orderByStoreKeeper?statusFilter=$status",
      ),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      List orders = data['orders'];

      return orders.map((e) => OrderModel.fromJson(e)).toList();
    } else {
      throw Exception("Failed to load orders");
    }
  }

  Future<bool> updateOrderStatus(int orderId, String status) async {
    final token = await LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final response = await http.patch(
      Uri.parse("$baseUrl/orders/v1/order/updateByStatus/$orderId"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "status": status,
      }),
    );

    log.i("UPDATE STATUS RESPONSE: ${response.body}");

    return response.statusCode == 200;
  }
  Future<void> markAsDelivered(int orderId) async {
    try {
      bool success =
      await OrderService.updateOrderStatus(orderId, "DELIVERED");

      if (success) {
        await fetchOrders("DELIVERED");
      }
    } catch (e) {
      log.e("ERROR updating status: $e");
    }
  }
}
