import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../services/shopkeeper_profile_service.dart';
import '../models/shopkeeper_profile_model.dart';

class ShopkeeperReferToCustomer extends StatefulWidget {
  const ShopkeeperReferToCustomer({super.key});

  @override
  State<ShopkeeperReferToCustomer> createState() =>
      _ShopkeeperReferToCustomerScreenState();
}

class _ShopkeeperReferToCustomerScreenState
    extends State<ShopkeeperReferToCustomer> {

  bool isLoading = true;
  String storeName = "";
  String selectedStoreId = "";

  @override
  void initState() {
    super.initState();
    loadStore();
  }

  Future<void> loadStore() async {
    final StorekeeperModel? data =
    await ShopkeeperService.getProfile();

    if (data != null && mounted) {
      setState(() {
        storeName = data.storeName;
        selectedStoreId = data.storeQrId;
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          "Refer to Customer",
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),

      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [

            Text(
              storeName.isEmpty ? "No Store" : storeName,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),

            const SizedBox(height: 30),

            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: QrImageView(
                data: selectedStoreId.isEmpty
                    ? "No Store Selected"
                    : selectedStoreId,
                version: QrVersions.auto,
                size: 220,
                backgroundColor: Colors.white,
              ),
            ),

            const SizedBox(height: 20),

            Text(
              selectedStoreId.isEmpty
                  ? "No Store ID"
                  : selectedStoreId,
              style: const TextStyle(
                fontSize: 18,
                color: Colors.green,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 20),

            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: () {
                  if (selectedStoreId.isEmpty) return;

                  Share.share(
                    "Add $storeName to start shopping on Nukkad App\nStore ID: $selectedStoreId",
                  );
                },
                child: const Text(
                  "Share",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}