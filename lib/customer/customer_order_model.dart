import '../models/order_item_model.dart';

class CustomerOrderModel {
  final int orderId;
  final String storeName;
  final String orderStatus;
  final String orderDate;
  final double price;
  final List<OrderItemModel> items;

  CustomerOrderModel({
    required this.orderId,
    required this.storeName,
    required this.orderStatus,
    required this.orderDate,
    required this.price,
    required this.items,
  });

  factory CustomerOrderModel.fromJson(Map<String, dynamic> json) {
    return CustomerOrderModel(
      orderId: json['orderId'],
      storeName: json['storeName'] ?? '',
      orderStatus: json['orderStatus'] ?? '',
      orderDate: json['orderDate'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      items: (json['items'] as List)
          .map((item) => OrderItemModel.fromJson(item))
          .toList(),
    );
  }
}