import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/shopkeeper_order_model.dart';
import '../providers/shopkeeper_order_provider.dart';

class OrderHistoryScreen extends StatefulWidget {
  const OrderHistoryScreen({super.key});
  @override
  State<OrderHistoryScreen>createState() => _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends State<OrderHistoryScreen> {
  List<ShopkeeperOrderModel> orders = [];
  List<ShopkeeperOrderModel> filteredOrders = [];
  bool isLoading = true;
  DateTime? fromDate;
  DateTime? toDate;
  String? selectedStatus;
  @override
  void initState() {
    super.initState();
    Future.microtask(() =>
        Provider.of<ShopkeeperOrderProvider>(context, listen: false).fetchOrders());
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
            order.orderStatus.toLowerCase().replaceAll("_", " ") ==
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
  Color getStatusColor(String status) {
    switch (status) {
      case "DELIVERED":
        return Colors.green;
      case "CANCELLED":
        return Colors.red;
      case "IN_PROGRESS":
        return Colors.blue;
      default:
        return Colors.orange;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        title: Text("My Orders"),
        actions: [
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: openFilterSheet,
          )
        ],
      ),

      body: Consumer<ShopkeeperOrderProvider>(
        builder: (context, provider, child) {

          if (provider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }

          if (provider.orders.isEmpty) {
            return Center(child: Text("No Orders Found"));
          }
          orders = provider.orders;
          if (selectedStatus == null && fromDate == null && toDate == null) {
            filteredOrders = List.from(orders);
          }


          final displayList =
          (selectedStatus == null && fromDate == null && toDate == null)
              ? orders
              : filteredOrders;

          if (displayList.isEmpty) {
            return Center(child: Text("No Orders Found"));
          }
          return ListView.builder(
            padding: EdgeInsets.all(12),
            itemCount: displayList.length,
            itemBuilder: (context, index) {
              final order = displayList[index];
              final deliveryDate = order.deliveredDate;
              return Container(
                margin: EdgeInsets.only(bottom: 12),
                padding: EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),

                  boxShadow: [
                    BoxShadow(
                      color: Colors.black12,
                      blurRadius: 6,
                      offset: Offset(0, 2),
                    )
                  ],
                ),

                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "Order ID : #${order.id}",
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          formatDate(order.orderDate),
                          style: TextStyle(color: Colors.green),
                        )
                      ],
                    ),

                    SizedBox(height: 8),

                    Text("Customer : ${order.customerName }"),
                    Text("Total Items : ${order.totalItems}"),
                    Text("Total Price : ₹${order.totalPrice}"),

                    SizedBox(height: 10),

                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: getStatusColor(order.status).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        order.status == "DELIVERED"
                            ? "Delivered on ${formatDate(deliveryDate)}"
                            : order.status.replaceAll("_", " "),
                        style: TextStyle(
                          color: getStatusColor(order.status),
                        ),
                      ),
                    )
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }
  void openFilterSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(16),
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
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      TextButton(
                        onPressed: () {
                          clearFilters();
                          Navigator.pop(context);
                        },
                        child: const Text("Clear"),
                      )
                    ],
                  ),

                  // FROM DATE
                  ListTile(
                    title: Text(
                      fromDate == null
                          ? "From: Select"
                          : "From: ${fromDate!.toLocal().toString().split(
                          ' ')[0]}",
                    ),
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
                  ),
                  // TO DATE
                  ListTile(
                    title: Text(
                      toDate == null
                          ? "To: Select"
                          : "To: ${toDate!.toLocal().toString().split(' ')[0]}",
                    ),
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
                  ),

                  // STATUS DROPDOWN
                  DropdownButtonFormField<String>(
                    initialValue: selectedStatus,
                    hint: const Text("Select a status"),
                    items: [
                      "Pending",
                      "In Progress",
                      "Delivered",
                      "Cancelled",
                      "DISPATCHED",
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

                  const SizedBox(height: 20),

                  // BUTTONS
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey,
                          ),
                          onPressed: () => Navigator.pop(context),
                          child: const Text("Cancel"),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                          ),
                          onPressed: () {
                            applyFilters();
                            Navigator.pop(context);
                          },
                          child: const Text("Apply"),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            );
          },
        );
      },
    );
  }
}
String formatDate(String date) {
  try {
    final parsedDate = DateTime.parse(date);
    return "${parsedDate.day.toString().padLeft(2, '0')}/"
        "${parsedDate.month.toString().padLeft(2, '0')}/"
        "${parsedDate.year}";
  } catch (e) {
    return date;
  }
}