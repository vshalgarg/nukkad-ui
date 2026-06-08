import 'order_item_model.dart';

class OrderModel {
  final int orderId;
  final String customerName;
  final int totalItems;
  final double totalPrice;
  final String orderStatus;
  final String orderDate;
  final String? deliveredDate;
  final List<dynamic> items;
  final Map<String, dynamic>? address;
  final String updatedAt;
  final String? customerPhone;
  final String storePhone;

  OrderModel({
    required this.orderId,
    required this.customerName,
    required this.totalItems,
    required this.totalPrice,
    required this.orderStatus,
    required this.orderDate,
    required this.items,
    required this.address,
    required this.updatedAt,
    this.deliveredDate,
    required this.storePhone,
    this.customerPhone
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final items = (json['items'] is List) ? json['items'] : [];

    double total = 0;
    for (var item in items) {
      total += double.tryParse(item['price'].toString()) ?? 0;
    }

    return OrderModel(
      orderId: json['orderId'] ?? 0,
      customerName: json['address']?['name'] ?? "",
      totalItems: items.length,
      totalPrice: total,
      orderStatus: json['orderStatus'] ?? "PENDING",
      orderDate: json['orderDate'] ?? "",
      items: items
          .map((e) => OrderItemModel.fromJson(e))
          .toList(),
      address: json['address'],
      updatedAt: json['updatedAt']?.toString() ?? "",
      storePhone: json['storePhone']??"",
      customerPhone: json['address']?['mobileNumber'] ?? "",
    );
  }

}