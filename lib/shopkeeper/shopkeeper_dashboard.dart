import 'dart:io';

import 'package:codemonks_nukkad/screens/order_history_screen.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../common/app_links.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../orders/order_details.dart';
import '../providers/order_provider.dart';
import '../models/order_model.dart';
import '../screens/payment_option_screen.dart';
import '../screens/payment_qr_screen.dart';
import '../screens/shopkeeper_profile.dart';
import '../screens/shopkeeper_refer_to_customer.dart';
import '../services/order_service.dart' as OrderService;
import '../services/shopkeeper_profile_service.dart';
import '../services/store_storage.dart';

class ShopkeeperDashboard extends StatefulWidget {
  const ShopkeeperDashboard({super.key});

  @override
  State<ShopkeeperDashboard> createState() => _ShopkeeperDashboardState();
}

class _ShopkeeperDashboardState extends State<ShopkeeperDashboard> {
  File? profileImage;
  final ImagePicker _picker = ImagePicker();
  String name = '';
  String shopName = '';
  String storeId = '';
  String mobileNumber = "";
  Future<void> makeCall(String phone) async {
    if (phone.isEmpty) {
      log.e("Phone number is empty");
      return;
    }

    final Uri url = Uri.parse("tel:$phone");

    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw "Could not launch dialer";
    }
  }

  Future<void> openWhatsApp(String phone, int orderId) async {
    if (phone.isEmpty) {
      log.e("Phone number is empty");
      return;
    }
    phone = phone.replaceAll(" ", "");

    if (!phone.startsWith("91")) {
      phone = "91$phone";
    }

    final message = "Hello, regarding Order #$orderId";

    final Uri url = Uri.parse(
      "https://wa.me/$phone?text=${Uri.encodeComponent(message)}",
    );

    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      throw "Could not open WhatsApp";
    }
  }
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Future.microtask(() {
        context.read<OrderProvider>()
            .fetchOrders("PENDING");
      });
    });
    print("Dashboard HashCode: ${hashCode}");

    loadUserData();
  }
  Future<void> pickImageForProfile() async {
    final XFile? image = await showModalBottomSheet<XFile?>(
      context: context,
      builder: (_) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text("Camera"),
              onTap: () async {
                final img = await _picker.pickImage(source: ImageSource.camera);
                Navigator.pop(context, img);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo),
              title: const Text("Gallery"),
              onTap: () async {
                final img = await _picker.pickImage(source: ImageSource.gallery);
                Navigator.pop(context, img);
              },
            ),
          ],
        ),
      ),
    );

    if (image != null && mounted) {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString('profile_image', image.path);

      setState(() {
        profileImage = File(image.path);
      });
    }
  }
  Future<void> loadUserData() async {
    try {
      final profile = await ShopkeeperService.getProfile();

      if (profile != null) {
        final prefs = await SharedPreferences.getInstance();

        await prefs.setString(
          'shopkeeper_name',
          profile.name,
        );

        await prefs.setString(
          'shopkeeper_store_name',
          profile.storeName,
        );

        final imagePath = prefs.getString('profile_image');

        if (imagePath != null && File(imagePath).existsSync()) {
          profileImage = File(imagePath);
        }

        setState(() {
          name = profile.name;
          shopName = profile.storeName;
        });

        print("PROFILE NAME => ${profile.name}");
        print("PROFILE STORE => ${profile.storeName}");
      }
    } catch (e) {
      print("LOAD PROFILE ERROR => $e");
    }
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: _buildDrawer(),
      backgroundColor: Colors.white,

      appBar: AppBar(
        title: const Text("My Orders"),
        centerTitle: true,
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu, color: Colors.black),
            onPressed: () => Scaffold.of(context).openDrawer(),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),

      body: Column(
        children: [
          // TABS
          Consumer<OrderProvider>(
            builder: (context, provider, child) {
              return Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  Expanded(
                      child: buildTab("PENDING", provider.pendingCount)),
                  buildTab("IN_PROGRESS", provider.inProgressCount ),
                  buildTab("DELIVERED", provider.deliveredCount ),
                ],
              );
            },
          ),

          const SizedBox(height: 10),

          Expanded(
            child: Consumer<OrderProvider>(
              builder: (context, provider, child) {

                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (provider.orders.isEmpty) {
                  return const Center(child: Text("No Orders"));
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(10),
                  itemCount: provider.orders.length,
                  itemBuilder: (context, index) {
                    final order = provider.orders[index];
                    return buildOrderCard(order);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }
  Widget buildTab(String status, int count) {
    return Consumer<OrderProvider>(
      builder: (context, provider, child) {
        final isSelected = provider.currentStatus == status;

        return GestureDetector(
          onTap: () {
            provider.fetchOrders(status);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? Colors.black : Colors.grey[200],
              borderRadius: BorderRadius.circular(20),
            ),
            child:FittedBox(
              fit: BoxFit.scaleDown,
           child: Text(
              "${formatStatus(status)} ($count)",
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.black,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),),
        );
      },
    );
  }

  String formatStatus(String status) {
    return status.replaceAll("_", " ");
  }
  Widget buildOrderCard(OrderModel order) {
    log.d("UPDATED AT: ${order.updatedAt}");
    final deliveryDate =order.updatedAt;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: EdgeInsets.all(MediaQuery.of(context).size.width * 0.03),

      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade300,
            blurRadius: 6,
            spreadRadius: 2,
          ),
        ],
      ),

      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              InkWell(
                  onTap:()
      {
      Navigator.push(context,
      MaterialPageRoute(
      builder: (_) => OrderDetailsScreen(order: order),
      ),
      );
      },
                    child: Text(
                      "Order #${order.orderId}",
                      style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: MediaQuery.of(context).size.width * 0.04),
                    )
                    ),
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert),

                      onSelected: (value) {
                        if (value == 'call') {
                          makeCall(order.customerPhone ?? "");
                        } else if (value == 'whatsapp') {
                          openWhatsApp(order.customerPhone ?? "", order.orderId);
                        }
                      },

                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'call',
                          child: Row(
                            children: [
                              Icon(Icons.call, color: Colors.green),
                              SizedBox(width: 10),
                              Text("Call"),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'whatsapp',
                          child: Row(
                            children: [
                              Icon(Icons.message, color: Colors.green),
                              SizedBox(width: 10),
                              Text("WhatsApp"),
                            ],
                          ),
                        ),
                      ],
                    ),
            ],
          ),

          const SizedBox(height: 6),
          Text("Order Date: ${formatDate(order.orderDate)}"),
          Text(
            "Customer Name: ${order.customerName}",
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            "Address: ${(order.address?['addressLine1'] ?? "").toString().isNotEmpty
                ? order.address!['addressLine1']
                : 'N/A'}",
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),

          Text(
            "Landmark: ${(order.address?['landmark'] ?? "").toString().isNotEmpty
                ? order.address!['landmark']
                : 'N/A'}",
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
      Text(
        "Quantity: ${order.items.length}",
      ),
          if (order.orderStatus == "DELIVERED") ...[
            const SizedBox(height: 6),
            Text(
              "Total: ₹ ${calculateTotal(order)}",
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
       const  SizedBox(height: 6),
            Text(deliveryDate.isNotEmpty
    ? "DELIVERED ON ${formatDate(deliveryDate)}"
        : "DELIVERED",
    style: const TextStyle(
    color: Colors.green,
    fontWeight: FontWeight.bold,
    ),
    ),
          ],
          const SizedBox(height: 10),
          if (order.orderStatus != "DELIVERED")
            Row(
              children: [
                Expanded(
                  child: Text(
                    order.orderStatus,
                    style: TextStyle(
                      color: Colors.orange,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),


                if (order.orderStatus == "IN_PROGRESS")
                  ElevatedButton(
                    onPressed: () {
                      _showRejectDialog(context,order.orderId);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: const Text("Reject",
                        style: TextStyle(color: Colors.white)),
                  ),
                if (order.orderStatus == "DISPATCHED")
                  ElevatedButton(
                    onPressed: () =>
                      showConfirmOrderDialog(context, order.orderId),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: const Text("Deliver",
                        style: TextStyle(color: Colors.white)),
                  ),
                if (order.orderStatus == "PENDING")
                  ElevatedButton(
                    onPressed: () {
                      _showRejectDialog(context,order.orderId);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    child: const Text("Reject",
                        style: TextStyle(color: Colors.white)),
                  ),
              ],
            ),
        ],
      ),
    );
  }

  double getTotalQuantity(OrderModel order) {
    double total = 0;

    for (var item in order.items) {
      if (item is Map<String, dynamic>) {
        total += double.tryParse(item['quantity']?.toString() ?? "0") ?? 0;
      }
    }

    return total;
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

  Widget _buildDrawer() {
    log.i("NAME: $name");
    log.i("SHOP NAME: $shopName");
    print("Drawer HashCode: ${hashCode}");
    print("Drawer Values: $name | $shopName");
    return Drawer(
      child: Column(
        children: [
          SizedBox(height: MediaQuery.of(context).padding.top),

          ListTile(
            leading: GestureDetector(
              onTap: pickImageForProfile,
              child: CircleAvatar(
                radius: 25,
                backgroundColor: Colors.grey.shade300,
                backgroundImage:
                profileImage != null ? FileImage(profileImage!) : null,
                child: profileImage == null
                    ? const Icon(Icons.perm_identity_rounded, color: Colors.black)
                    : null,
              ),
            ),
            title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(shopName),
            trailing: IconButton(
              icon: const Icon(Icons.settings),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => StoreDetailScreen()),
                ).then((_) {loadUserData();
              });
                },
            ),
          ),

          const Divider(),
          _drawerItem(Icons.history, 'Order History'),
          _drawerItem(Icons.credit_card, 'Payment Options'),
          _drawerItem(Icons.qr_code, 'Payment QR Code'),
          _drawerItem(Icons.share, 'Refer to a Store '),
          _drawerItem(Icons.share, 'Refer Store to Customer'),
          _drawerItem(Icons.help_outline, 'Help and Support'),
          _drawerItem(Icons.privacy_tip, 'Privacy Policy'),
          _drawerItem(Icons.description, 'Terms & Conditions'),
        ],
      ),
    );
  }

  Widget _drawerItem(IconData icon, String title) {
    return ListTile(
      leading: Icon(icon),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: () async {
        Navigator.pop(context);

        final Title = title.trim();

        switch (Title) {

          case 'Order History':
            Navigator.push( context,
              MaterialPageRoute(
                builder: (_) => OrderHistoryScreen(),
              ),);
            break;
          case 'Payment Options':
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => const PaymentOptionScreen(),
              ),
            );
            break;

          case 'Payment QR Code':
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PaymentQrScreen(
                ),
              ),
            );
            break;
          case 'Refer to a Store':
            Share.share(
                'Start Shopping On Nukkad App:\n'
                'https://play.google.com/store/apps/details?id=com.codemonks.nukkad');
            break;
          case 'Refer Store to Customer':
        Navigator.push(
        context,
        MaterialPageRoute(
        builder: (_) => ShopkeeperReferToCustomer(
        ),
        ),
        );
            break;
          case 'Help and Support':
            AppLinks.openUrl(AppLinks.helpAndSupport);
            break;
          case 'Privacy Policy':
            AppLinks.openUrl(AppLinks.privacyPolicy);
            break;
          case 'Terms & Conditions':
            AppLinks.openUrl(AppLinks.termsAndConditions);
            break;
        }
      },
    );
  }
  void _showRejectDialog(BuildContext context, int orderId) {
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text("Reject Order",style: TextStyle(color: Colors.black),),
          content: const Text("Are you sure you want to reject this order?"),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.grey),
              child: const Text("Cancel",style: TextStyle(color: Colors.white)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                bool success = await OrderService.updateOrderStatus(
                    orderId, "CANCELLED");
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Order Rejected Successfully")),
                  );
                  context.read<OrderProvider>()
                      .fetchOrders(context.read<OrderProvider>().currentStatus);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Failed to Reject Order")),
                  );
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
              child: const Text("Reject",style: TextStyle(
        color: Colors.white)),
            ),
          ],
        );
      },
    );
  }
}
double calculateTotal(OrderModel order) {
  double total = 0;
  final items = order.items ;
  for (var item in items) {
    total += (item.price ?? 0);
  }
  return total;
}
void showConfirmOrderDialog(BuildContext context, int orderId) {
  showDialog(
    context: context,
    builder: (_) {
      return AlertDialog(
        title: const Text("Deliver Order",style: TextStyle(color: Colors.white),),
        content: const Text("Are you sure you want to deliver this order?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel", style: TextStyle(color: Colors.white)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final provider =
              Provider.of<OrderProvider>(context, listen: false);
              await provider.markAsDelivered(orderId);
              provider.fetchOrders("DELIVERED");
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text("Deliver",
                style: TextStyle(color: Colors.white)),
          ),
        ],
      );
    },
  );
}