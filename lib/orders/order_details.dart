import 'package:flutter/material.dart';
import '../models/order_model.dart';
import '../models/order_item_model.dart';
import '../services/order_service.dart' as OrderService;

class OrderDetailsScreen extends StatefulWidget {
  final OrderModel order;

  const OrderDetailsScreen({super.key, required this.order, });

  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {

  final TextEditingController noteController = TextEditingController();
  double getTotal() {
    double total = 0;
    for (var item in widget.order.items) {
      if (item.isInStock &&
          item.priceController.text.trim().isNotEmpty) {
        total += double.tryParse(item.priceController.text.trim()) ?? 0;
      }
    }
    return total;
  }
  bool isValid() {
    for (var item in widget.order.items) {
      if (item.isInStock &&
          item.priceController.text.trim().isEmpty) {
        return false;
      }
    }
    return true;
  }
  double getTotalQuantity(OrderModel order) {
    double total = 0;
    for (var item in order.items) {
      if (item.isInStock) {
        total += item.quantity;
      }
    }
    return total;
  }
  void showDispatchDialog(OrderModel order) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [

                const Text(
                  "Dispatch Order",
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold),
                ),

                const SizedBox(height: 10),

                Text("Order #${order.orderId}",
                    style: const TextStyle(fontWeight: FontWeight.bold)),

                const SizedBox(height: 10),

                buildRow("Customer Name", order.customerName),

                buildRow(
                  "Address",
                  (order.address != null &&
                      (order.address?['addressLine1'] ?? "").toString().isNotEmpty)
                      ? order.address!['addressLine1']
                      : "N/A",
                ),
                buildRow(
                  "Landmark",
                  (order.address != null &&
                      (order.address?['landmark'] ?? "").toString().isNotEmpty)
                      ? order.address!['landmark']
                      : "N/A",
                ),

                buildRow("Quantity", order.items.isNotEmpty
                      ? getTotalQuantity(order).toStringAsFixed(0)
                      : "0",
                ),

                buildRow("Price", "₹${order.totalPrice.toStringAsFixed(2)}",
                  isPrice: true,
                ),

                const SizedBox(height: 20),

                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.grey,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: const Text("Cancel"),
                      ),
                    ),

                    const SizedBox(width: 10),

                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                          Navigator.pop(context);
                          await dispatchOrderApi(order);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        child: const Text("Dispatch"),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  Widget buildRow(String title, String value,
      {bool isPrice = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text("$title:"),
          Text(
            value,
            style: TextStyle(
              color: isPrice ? Colors.green : Colors.black,
              fontWeight:
              isPrice ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> dispatchOrderApi(OrderModel order) async {

    List<Map<String, dynamic>> items = [];

    for (var item in order.items) {
      if (item.isInStock) {
        items.add({
          "itemId": item.itemId,
          "price":
          double.tryParse(item.priceController.text) ?? 0,
        });
      }
    }

    bool success = await OrderService.dispatchOrder(
      orderId: order.orderId,
      items: items,
      note: noteController.text,
    );

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Order Dispatched")),
      );

      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Dispatch Failed")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    return Scaffold(
      backgroundColor: Colors.grey[100],

      appBar: AppBar(
        title: const Text("Order Details"),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
      ),
        body: Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Delivery Address",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(14),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.green, width: 1.5),
                          borderRadius: BorderRadius.circular(16),
                          color: Colors.white,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  "Customer : ${order.address?['name'] ?? 'N/A'}",
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                const Icon(Icons.more_vert),
                              ],
                            ),

                            const SizedBox(height: 6),

                            Text(
                              "Contact Number : ${order.address?['mobileNumber'] ?? 'N/A'}",
                            ),

                            const SizedBox(height: 6),

                        Text("Address: ${order.address?['addressLine1'] ?? 'N/A'}"),

                      ]
                        ),
                  ),

                      Text("Ordered On: ${order.orderDate.split("T")[0]}"),


                      const SizedBox(height: 10),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Order ID: #${order.orderId}",
                              style: const TextStyle(fontWeight: FontWeight.bold)),

                          Text(
                            "Total: ₹${getTotal().toStringAsFixed(2)}",
                            style: const TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      /// ✅ ITEMS
                      Column(
                        children: order.items.map((item) {
                          return buildItemCard(item);
                        }).toList(),
                      ),

                      const SizedBox(height: 20),

                      /// ✅ NOTE
                      const Text("Note:",
                          style: TextStyle(fontWeight: FontWeight.bold)),

                      const SizedBox(height: 8),

                      TextField(
                        controller: noteController,
                        maxLines: 4,
                        decoration: InputDecoration(
                          hintText: "Write a note...",
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
      Container(
        padding: const EdgeInsets.all(12),
        color: Colors.white,
        child: Row(
          children: [

            Expanded(
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text("Reject Order",style: TextStyle(
                  color: Colors.white
                ),),
              ),
            ),

            const SizedBox(width: 10),

            Expanded(
              child: ElevatedButton(
                onPressed: isValid()
                    ? () {
                  showDispatchDialog(order);
                }
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                  isValid() ? Colors.green : Colors.grey,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text("Dispatch Order",style: TextStyle(
                    color: Colors.white)
              ),
            ),
            )
          ],
        ),
      ),
    ])),
              )]),
    );
  }
  Widget buildItemCard(OrderItemModel item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),

      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.grey.shade300, blurRadius: 6),
        ],
      ),

      child: Row(
        children: [

          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: item.imageUrls.isNotEmpty
                ? Image.network(
              item.imageUrls[0],
              width: 70,
              height: 70,
              fit: BoxFit.cover,
            )
                : Container(
              width: 70,
              height: 70,
              color: Colors.grey[300],
            ),
          ),

          const SizedBox(width: 12),

          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.itemName,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold)),
                Text("Weight: ${item.quantity} ${item.unit}"),
              ],
            ),
          ),

          Column(
            children: [

              GestureDetector(
                onTap: () {
                  setState(() {
                    item.isInStock = !item.isInStock;

                    if (!item.isInStock) {
                      item.priceController.clear();
                    }
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 14, vertical: 6),
                  decoration: BoxDecoration(
                    color: item.isInStock
                        ? Colors.green
                        : Colors.red,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                  Text(
                  item.isInStock ? "In Stock" : "Out of Stock",
                        style: TextStyle(color: Colors.white)),
                       SizedBox(width: 6),
                      const CircleAvatar(
                        radius: 6,
                        backgroundColor: Colors.white,
                      )
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 8),

              Container(
                width: 90,
                height: 35,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.grey),
                  color: Colors.grey[100],
                ),
                child: item.isInStock
                    ? TextField(
                  controller: item.priceController,
                  keyboardType: TextInputType.number,
                  textAlign: TextAlign.center,
                  onChanged: (val) {
                    setState(() {});
                  },
                  decoration: const InputDecoration(
                    hintText: "Price",
                    border: InputBorder.none,
                  ),
                )
                    : const Text(
                  "Price",
                  style: TextStyle(color: Colors.grey),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}