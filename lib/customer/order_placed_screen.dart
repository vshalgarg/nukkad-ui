import 'package:codemonks_nukkad/customer/customer_dashboard.dart';
import 'package:flutter/material.dart';

class OrderPlacedScreen extends StatelessWidget {
  const OrderPlacedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Checkout"),
        centerTitle: true,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.shopping_bag_outlined,
            size: 120,
          ),
          const SizedBox(height: 20),
          const Text(
            "Order Placed",
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 10),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 40),
            child: Text(
              "Thank you for your purchase.\nYou can view your order in 'My Orders' section",
              textAlign: TextAlign.center,
            ),
          ),
          const SizedBox(height: 30),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              padding: const EdgeInsets.symmetric(
                horizontal: 40,
                vertical: 12,
              ),
            ),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_)=>
              CustomerDashboard()));
            },
            child: const Text("Continue Shopping",
            style: TextStyle(color: Colors.white),),
          ),
        ],
      ),
    );
  }
}
