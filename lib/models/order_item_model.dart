import 'package:flutter/material.dart';
class OrderItemModel {
  final int itemId;
  final String itemName;
  final String unit;
  final double quantity;
  final double price;
  final List<dynamic> imageUrls;
  bool isInStock;
  TextEditingController priceController;
  OrderItemModel({
    required this.itemId,
    required this.itemName,
    required this.unit,
    required this.quantity,
    required this.imageUrls,
    this.isInStock = true,
   required this.price,
  }) : priceController = TextEditingController(  text: price?.toString() ?? '',);


  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      itemId: int.tryParse(json['itemId'].toString()) ?? 0,

      itemName: json['itemName'] ?? '',
      unit: json['unit'] ?? '',

      quantity: double.tryParse(json['quantity'].toString()) ?? 0,

      price: double.tryParse(json['price'].toString()) ?? 0,

      imageUrls: (json['imageUrls'] as List? ?? [])
          .map((e) => e.toString())
          .toList(),

      isInStock: json['isInStock'] ?? true,
    );
  }
}