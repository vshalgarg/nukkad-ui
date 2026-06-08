import 'package:flutter/material.dart';
import '../services/shopkeeper_order_service.dart';
import '../common/logger.dart';
import '../models/shopkeeper_order_model.dart';

class ShopkeeperOrderProvider extends ChangeNotifier {

  List<ShopkeeperOrderModel> orders = [];
  bool isLoading = false;
  String? fromDate;
  String? toDate;
  String? status;

  Future<void> fetchOrders() async {
    isLoading = true;
    notifyListeners();

    try {
      final response = await OrderService.getOrderHistory(
        fromDate: fromDate,
        toDate: toDate,
        status: status,
      );
      log.d("API RESPONSE: $response");

      orders = response.cast<ShopkeeperOrderModel>();

    } catch (e) {
      log.e(e);
    }

    isLoading = false;
    notifyListeners();
  }
}