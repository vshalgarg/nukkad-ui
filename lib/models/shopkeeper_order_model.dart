import 'address_model.dart';
import 'order_item_model.dart';

class ShopkeeperOrderModel {
  final int orderId;
  final String orderStatus;
  final String orderDate;
  final String updatedAt;
  final String customerName;
  final String customerPhone;
  final AddressModel? address;
  final List<OrderItemModel> items;
  final String id;
  String status;
  final String totalItems;
  final double totalPrice;
  final String deliveredDate;
  final String landmark;

  ShopkeeperOrderModel({
    required this.orderId,
    required this.orderStatus,
    required this.orderDate,
    required this.updatedAt,
    required this.customerName,
    required this.customerPhone,
    required this.address,
    required this.items,
    required this.status,
    required this.id,
    required this.totalItems,
    required this.totalPrice,
    required this.deliveredDate,
    required this.landmark,
  });

  factory ShopkeeperOrderModel.fromJson(Map<String, dynamic> json) {
    List items = [];
    if (json['items'] != null && json['items'] is List) {
      items = json['items'];
    }

    double total = 0;
    for (var item in items) {
      total += double.tryParse(item['price'].toString()) ?? 0;
    }

    return ShopkeeperOrderModel(
      orderId: json['orderId'] ?? 0,
      orderDate: json['orderDate'] ?? "",
      orderStatus: json['orderStatus'] ?? "PENDING",
      updatedAt: json['deliveryAt'] ?? '',
      deliveredDate: json['deliveryAt'] ?? '',
      customerName: json['address']?['name'] ?? "",
      customerPhone: json['address']?['mobileNumber'] ?? "",

      address: json['address'] != null
          ? AddressModel.fromJson(json['address'])
          : null,

      items: (json['items'] != null && json['items'] is List)
          ? (json['items'] as List)
          .map((e) => OrderItemModel.fromJson(e))
          .toList()
          : [],

      status: json['orderStatus'] ?? "PENDING",
      id: (json['orderId'] ?? 0).toString(),

      totalItems: items.length.toString(),
      totalPrice: total,
      landmark: json['address']?['landmark'] ?? '',
    );
  }
}
