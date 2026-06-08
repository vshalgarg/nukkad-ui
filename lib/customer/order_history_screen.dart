import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../common/logger.dart';
import '../providers/cart_provider.dart';
import 'customer_order_model.dart';
import 'shopping_cart_screen.dart';
import '../services/cart_services.dart';
import '../services/order_history_service.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  State<OrderHistoryScreen> createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  List<CustomerOrderModel> orders = [];
  List<CustomerOrderModel> filteredOrders = [];
  bool isLoading = true;
  DateTime? fromDate;
  DateTime? toDate;
  String? selectedStatus;

  @override
  void initState() {
    super.initState();
    loadOrders();
  }

  Future<void> loadOrders() async {
    try {
      final data = await OrderService().getOrderHistory();

      setState(() {
        orders = List<CustomerOrderModel>.from(data);
        filteredOrders = List<CustomerOrderModel>.from(data);
        isLoading = false;
      });

      log.d("API DATA: $data");
    } catch (e) {
      setState(() => isLoading = false);
      log.e("Order load error: $e");
    }
  }

  Future<void> repeatOrder(CustomerOrderModel order) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator()),
    );

    try {
      await CartService().clearCart();
      await Future.wait(
        order.items.map((item) {
          return CartService.addToCart(
            itemId: item.itemId,
            quantity: item.quantity.toInt(),
            unit: item.unit,
          );
        }),
      );
     await Provider.of<CartProvider>(context, listen: false).updateCart();
      Navigator.pop(context);
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const ShoppingCartScreen()),
      );
    } catch (e) {
      Navigator.pop(context);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to repeat order")),
      );
    }
  }

  String formatDate(String date) {
    try {
      if (date.contains("T")) {
        return date.split("T")[0];
      }
      return date;
    } catch (e) {
      return "";
    }
  }

  void applyFilters() {
    setState(() {
      filteredOrders = orders.where((order) {
        final orderDate = DateTime.tryParse(order.orderDate);
        // Filter by status
        final statusMatch = selectedStatus == null ||
            selectedStatus == "Select a status" ||
            order.orderStatus.toLowerCase() ==
                selectedStatus!.toLowerCase();
        final fromMatch =
            fromDate == null || (orderDate != null &&
                orderDate.isAfter(fromDate!.subtract(const Duration(days: 1))));
        final toMatch =
            toDate == null || (orderDate != null &&
                orderDate.isBefore(toDate!.add(const Duration(days: 1))));

        return statusMatch && fromMatch && toMatch;
      }).toList();
    });
  }

  void clearFilters() {
    setState(() {
      fromDate = null;
      toDate = null;
      selectedStatus = null;
      filteredOrders = List.from(orders);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Orders"),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: openFilterSheet,
          )
        ],
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : filteredOrders.isEmpty
          ? const Center(child: Text("No Orders Found"))
          : ListView.builder(
        itemCount: filteredOrders.length,
        itemBuilder: (context, index) {
          final order = filteredOrders[index];

          return Card(
            margin: const EdgeInsets.all(10),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(15),
            ),
            child: ExpansionTile(
              title: Text(
                "Order ID : #${order.orderId}",
                style: const TextStyle(
                    fontWeight: FontWeight.bold),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Store : ${order.storeName}"),
                  Text("Total Items : ${order.items.length}"),
                  const SizedBox(height: 5),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 6, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.orange.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      order.orderStatus,
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    formatDate(order.orderDate),
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  GestureDetector(
                    onTap: () => repeatOrder(order),
                    child: const Text(
                      "Repeat Order",
                      style: TextStyle(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  )
                ],
              ),
              children: [
                const Divider(),
                const Padding(
                  padding: EdgeInsets.only(left: 16),
                  child: Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Items:",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                ...order.items.map((item) {
                  return ListTile(
                    title: Text(
                      "${item.itemName} (${item.quantity} ${item.unit})",
                    ),
                  );
                }).toList(),
                const SizedBox(height: 3),
              ],
            ),
          );
        },
      ),
    );
  }

  void openFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                top: 16,
                bottom: MediaQuery
                    .of(context)
                    .viewInsets
                    .bottom + 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [

                  // HEADER
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        "Filter Orders",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          clearFilters();
                          Navigator.pop(context);
                        },
                        child: const Text("Clear",
                        style: TextStyle(color: Colors.black),),
                      )
                    ],
                  ),

                  const SizedBox(height: 10),

                  // FROM DATE BOX
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setModalState(() => fromDate = picked);
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 16),
                      margin: const EdgeInsets.only(bottom: 12),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(
                        fromDate == null
                            ? "From: Select"
                            : "From: ${fromDate!.toLocal().toString().split(
                            ' ')[0]}",
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ),

                  // TO DATE BOX
                  GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now(),
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (picked != null) {
                        setModalState(() => toDate = picked);
                      }
                    },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 16),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Text(
                        toDate == null
                            ? "To: Select"
                            : "To: ${toDate!.toLocal().toString().split(
                            ' ')[0]}",
                        style: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // STATUS TITLE
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      "Order Status",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // DROPDOWN
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: DropdownButtonFormField<String>(
                      value: selectedStatus,
                      hint: const Text("Select a status"),
                      decoration: const InputDecoration(
                        border: InputBorder.none,
                      ),
                      items: [
                        "Pending",
                        "In Progress",
                        "Dispatched",
                        "Delivered",
                        "Cancelled"
                      ]
                          .map((status) =>
                          DropdownMenuItem(
                            value: status,
                            child: Text(status),
                          ))
                          .toList(),
                      onChanged: (value) {
                        setModalState(() => selectedStatus = value);
                      },
                    ),
                  ),

                  const SizedBox(height: 30),

                  // BUTTONS
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 60,
                          decoration: BoxDecoration(
                            color: Colors.grey.shade400,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text(
                              "Cancel",
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Container(
                          height: 50,
                          decoration: BoxDecoration(
                            color: Colors.green,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: TextButton(
                            onPressed: () {
                              applyFilters();
                              Navigator.pop(context);
                            },
                            child: const Text(
                              "Apply",
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
}
}