import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/qr_model.dart';
import '../db/local_storage.dart';
import 'payment_option_screen.dart';

class PaymentQrScreen extends StatefulWidget {
  const PaymentQrScreen({super.key});

  @override
  State<PaymentQrScreen> createState() => _PaymentQrScreenState();
}

class _PaymentQrScreenState extends State<PaymentQrScreen> {
  QRModel? defaultQR;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    fetchDefaultQR();
  }

  Future<void> fetchDefaultQR() async {
    setState(() => isLoading = true);

    try {
      final savedList = await LocalStorageService.getQRList();

      QRModel? found;

      if (savedList != null && savedList.isNotEmpty) {
        for (var q in savedList) {
          if (q.isDefault == true) {
            found = q;
            break;
          }
        }
      }

      setState(() {
        defaultQR = found;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        defaultQR = null;
        isLoading = false;
      });
    }
  }

  Future<void> openPaymentOptions() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const PaymentOptionScreen(),
      ),
    );

    await fetchDefaultQR();
  }

  Widget buildQRImage(String qr) {
    try {
      if (qr.isEmpty) return const Text("No QR Image");

      if (qr.startsWith("data:image")) {
        return SizedBox(
          height: 240,
          width: 240,
          child: Image.memory(
            base64Decode(qr.split(",").last),
            fit: BoxFit.cover,
          ),
        );
      }

      return SizedBox(
        height: 240,
        width: 240,
        child: Image.memory(
          base64Decode(qr),
          fit: BoxFit.cover,
        ),
      );
    } catch (e) {
      return const Text("Image Error");
    }
  }

  void openFullScreen() {
    if (defaultQR == null || defaultQR!.imageUrl.isEmpty) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(
            backgroundColor: Colors.black,
            iconTheme: const IconThemeData(color: Colors.white),
          ),
          body: Center(
            child: InteractiveViewer(
              child: buildQRImage(defaultQR!.imageUrl),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        centerTitle: true,
        title: const Text(
          "My QR Code",
          style: TextStyle(fontSize: 22, color: Colors.black),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: openPaymentOptions,
            icon: const Icon(Icons.edit, color: Colors.black),
          )
        ],
      ),

      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Default Payment QR",
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 30),

            GestureDetector(
              onTap: openFullScreen,
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 15,
                      offset: const Offset(0, 6),
                    )
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
                  child: defaultQR == null
                      ? const Text("No Default QR Found")
                      : buildQRImage(defaultQR!.imageUrl),
                ),
              ),
            ),

            const SizedBox(height: 20),

            const Text(
              "Tap QR to enlarge",
              style: TextStyle(
                color: Colors.grey,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }
}