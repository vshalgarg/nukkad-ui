import 'dart:convert';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/cart_item_model.dart';

class CartService {
  static final CartService _instance = CartService._internal();

  factory CartService() => _instance;

  CartService._internal();

  final List<CartItemModel> _cartItems = [];
  String selectedStore = "";

  List<CartItemModel> get cartItems => _cartItems;

  int get cartCount => _cartItems.length;
  static Future<bool> addToCart({
    required int itemId,
    required int quantity,
    required String unit,
  }) async {
    final token = LocalStorageService.getToken();
    final role = LocalStorageService.getRole();
    final baseUrl = dotenv.env['BASE_URL'];

    log.d("TOKEN: $token");
    log.d("ROLE: $role");

    if (token == null || token.isEmpty) {
      log.e(" No token found");
      return false;
    }

    if (role != "customer") {
      log.e(" Wrong role: $role");
      return false;
    }

    final url = Uri.parse("$baseUrl/cartItem/v1/add");

    final body = {
      "items": [
        {
          "itemId": itemId,
          "quantity": quantity,
          "unit": unit
        }
      ]
    };

    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode(body),
    );

    log.d("Add Cart Status: ${response.statusCode}");
    log.d("Add Cart Body: ${response.body}");

    return response.statusCode == 200 || response.statusCode == 201;
  }
  Future<List<CartItemModel>> getCartItems() async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final url = Uri.parse("$baseUrl/cartItem/v1/get");

    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    log.d("Cart GET Status: ${response.statusCode}");
    log.d("Cart GET Body: ${response.body}");

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);

      return data.map((item) => CartItemModel.fromJson(item)).toList();
    } else {
      return [];
    }
  }

  Future<bool> deleteCartItem(int itemId) async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final url = Uri.parse("$baseUrl/cartItem/v1/deleteItem/$itemId");

    final response = await http.delete(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    log.d("Delete Cart Status: ${response.statusCode}");
    log.d("Delete Cart Body: ${response.body}");
    log.d("Item Id:$itemId");
    return response.statusCode == 200;
  }
  Future<bool> updateCartItem({
    required int itemId,
    required String unit,
    required int quantity,
  }) async {

    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    if (token == null || token.isEmpty) {
      log.e("Error: Token is missing");
      return false;
    }
    final url = Uri.parse("$baseUrl/cartItem/v1/item/update");

    final body = {
      "itemId": itemId,
      "unit": unit,
      "quantity": quantity
    };

    final response = await http.put(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode(body),
    );

    log.d("Update Cart Status: ${response.statusCode}");
    log.d("Update Cart Body: ${response.body}");

    if (response.statusCode == 200) {
      await getCartItems();
      return true;
    }

    return false;
  }
  Future<bool> clearCart() async {
    final token = LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];

    final url = Uri.parse("$baseUrl/cartItem/v1/clear/cart");

    final response = await http.delete(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    log.d("Clear Cart Status: ${response.statusCode}");
    log.d("Clear Cart Body: ${response.body}");

    return response.statusCode == 200;
  }
  Future<bool> placeOrder({
    required int deliveryAddressId,
    required int storeKeeperId,
    required List<CartItemModel> cartItems,
  }) async {
    final token =await  LocalStorageService.getToken();
    final baseUrl = dotenv.env['BASE_URL'];
    final url = Uri.parse("$baseUrl/orders/v1/placeOrder");
    final body = {
      "deliveryAddressId": deliveryAddressId,
      "storeKeeperId": storeKeeperId,
      "orderItem": cartItems.map((item) => {
        "itemId": item.itemId,
        "quantity": item.quantity,
        "unit": item.unit,
      }).toList()
    };
    log.d("STORE KEEPER ID: $storeKeeperId");
    log.d("DELIVERY ADDRESS ID: $deliveryAddressId");
    log.d("REQUEST BODY: ${jsonEncode(body)}");
    log.d("TOKEN: $token");
    final response = await http.post(
      url,
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode(body),
    );
    log.d(jsonEncode(body));
    log.d("Place Order Status: ${response.statusCode} ");
    log.d("Place Order Body: ${response.body}");

    return response.statusCode == 200|| response.statusCode == 201;
  }
}