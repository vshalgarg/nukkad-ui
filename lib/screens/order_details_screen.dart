import 'package:flutter/material.dart';
import '../services/order_api_service.dart';
class OrderDetailsScreen extends StatefulWidget {
  final String orderId;
  final String store;
  final String status;

  const OrderDetailsScreen({
    super.key,
    required this.orderId,
    required this.store,
    required this.status,
  });
  @override
  State<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends State<OrderDetailsScreen> {
  late String currentStatus;
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    currentStatus = widget.status;
  }

  Future<void> updateStatus(String status) async {
    setState(() => isLoading = true);

    bool success = await OrderApiService.updateOrderStatus(
      orderId: int.parse(widget.orderId),
      status: status,
    );

    setState(() => isLoading = false);

    if (success) {
      setState(() {
        currentStatus = status;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Status Updated: $status")),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Update Failed")),
      );
    }
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
          title:  Text("Order Details")),
      body: Padding(
        padding:  EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Order ID: ${widget.orderId}",
                style:  TextStyle(fontSize: 18)),
             SizedBox(height: 8),
            Text("Store: ${widget.store}"),
             SizedBox(height: 8),
            Text("Status: ${widget.status}",
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            const Text(
              "Items",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text("• Rice"),
            const Text("• Milk"),
            const Text("• Bread"),
            const SizedBox(height: 30),

            if (isLoading)
              const Center(child: CircularProgressIndicator()),

            if (!isLoading) ...[
              ElevatedButton(
                onPressed: currentStatus == "PENDING"
                    ? () => updateStatus("IN_PROGRESS")
                    : null,
                child: const Text("Accept Order"),
              ),
              const SizedBox(height: 10),

              ElevatedButton(
                onPressed: currentStatus == "IN_PROGRESS"
                    ? () => updateStatus("DISPATCHED")
                    : null,
                child: const Text("Dispatch Order"),
              ),
              const SizedBox(height: 10),

              ElevatedButton(
                onPressed: currentStatus == "DISPATCHED"
                    ? () => updateStatus("DELIVERED")
                    : null,
                child: const Text("Mark as Delivered"),
              ),
              const SizedBox(height: 10),

              ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red),
                onPressed: currentStatus != "DELIVERED"
                    ? () => updateStatus("CANCELLED")
                    : null,
                child: const Text("Cancel Order",style: TextStyle(color: Colors.white),),
              ),
            ]
          ],
        ),
      ),
    );
  }
}