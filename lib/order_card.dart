import 'package:codemonks_nukkad/screens/order_history_screen.dart';
import 'package:flutter/material.dart';
import '../customer/customer_order_model.dart';
import 'customer/shopping_cart_screen.dart';

class OrderCard extends StatelessWidget {
  final CustomerOrderModel order;
  final bool isShopkeeper;
  final VoidCallback? onAccept;
  final VoidCallback? onReject;

  const OrderCard({
    super.key,
    required this.order,
    this.isShopkeeper = false,
    this.onAccept,
    this.onReject,
  });

  @override
  Widget build(BuildContext context) {
    final bool isCancelled = order.orderStatus.toLowerCase() == "cancelled";
    final bool isPending = order.orderStatus.toLowerCase() == "pending";
    final bool isAccepted = order.orderStatus.toLowerCase() == "accepted";

    Color statusColor = isCancelled
        ? Colors.red
        : isAccepted
        ? Colors.green
        : Colors.orange;

    return InkWell(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => OrderHistoryScreen(),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha:0.05),
              blurRadius: 10,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Order #${order.orderId}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  order.orderDate,
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),

            const SizedBox(height: 8),
            _infoText('Store', order.storeName),
            _infoText('Items', order.items.toString()),

            if (order.price != null)
              _infoText('Total Price', order.price.toString()),

            const SizedBox(height: 12),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Chip(
                  label: Text(
                    order.orderStatus.toUpperCase(),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  backgroundColor: statusColor.withValues(alpha: 0.1),
                ),

                if (!isShopkeeper)
                  TextButton(
                    onPressed: isCancelled
                        ? null
                        : () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const ShoppingCartScreen(),
                        ),
                      );
                    },
                    child: const Text(
                      "Repeat Order",
                      style: TextStyle(color: Colors.green),
                    ),
                  )
                else
                  Row(
                    children: [
                      OutlinedButton(
                        onPressed: isPending ? onAccept : null,
                        child: const Text("Accept"),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: isPending ? () {} : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red,
                        ),
                        child: const Text("Reject"),
                      ),
                    ],
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _infoText(String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: RichText(
        text: TextSpan(
          style: const TextStyle(color: Colors.black, fontSize: 14),
          children: [
            TextSpan(
              text: '$title: ',
              style: const TextStyle(color: Colors.grey),
            ),
            TextSpan(
              text: value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }
}
