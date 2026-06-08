import 'dart:convert';
import 'package:codemonks_nukkad/db/local_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../models/shopkeeper_order_model.dart';

Future<List<ShopkeeperOrderModel>> getOrders(String status) async {
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

  return orders.map((e) => ShopkeeperOrderModel.fromJson(e)).toList();
 } else {
  throw Exception("Failed to load orders");
 }
}
Future<Map<String, dynamic>> getOrdersRaw(String status) async {
 final token = await LocalStorageService.getToken();
 final baseUrl = dotenv.env['BASE_URL'];
 log.d("BASE URL: $baseUrl");
 log.d("STATUS FILTER: $status");
 log.d("TOKEN: $token");
 final response = await http.get(
  Uri.parse("$baseUrl/orders/v1/order/orderByStoreKeeper?statusFilter=$status"),
  headers: {
   "Content-Type": "application/json",
   "Authorization": "Bearer $token",
  },
 );
 log.d("STATUS CODE: ${response.statusCode}");
 log.d("RESPONSE BODY: ${response.body}");
 if (response.statusCode == 200) {
  return jsonDecode(response.body);
 } else {
  throw Exception("Failed to load orders");
 }
}
Future<bool> dispatchOrder({
 required int orderId,
 required List<Map<String, dynamic>> items,
 required String note,
}) async {
 final token = await LocalStorageService.getToken();
 final baseUrl = dotenv.env['BASE_URL'];
 final body = {
  "orderId": orderId,
  "orderItem": items,
  "storeKeeperNote": note,
 };

 try {
  final response = await http.post(
   Uri.parse("$baseUrl/orders/v1/order/dispatchOrder"),
   headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer $token",
   },
   body: jsonEncode(body),
  );

  log.d("Dispatch Response: ${response.body}");

  return response.statusCode == 200;
 } catch (e) {
  log.d("Dispatch Error: $e");
  return false;
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
   "orderStatus": status,
  }),
 );

 log.d("UPDATE STATUS RESPONSE: ${response.body}");

 return response.statusCode == 200;
}