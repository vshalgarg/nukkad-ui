import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../db/local_storage.dart';

class GenerateQrScreen extends StatefulWidget {
  const GenerateQrScreen({super.key});

  @override
  State<GenerateQrScreen> createState() => _GenerateQrScreenState();
}

class _GenerateQrScreenState extends State<GenerateQrScreen> {

  String? storeId;
  String? storeName;

  @override
  void initState() {
    super.initState();
    loadStore();
  }

  Future<void> loadStore() async {
    final id = await LocalStorageService.getStoreId();
    final name = await LocalStorageService.getStoreName();

    setState(() {
      storeId = id as String?;
      storeName = name;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Store QR"),
        centerTitle: true,
      ),
      body: storeId == null
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [

            Text(
              storeName ?? "Store",
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 30),

            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: QrImageView(
                  data: storeId!,
                  version: QrVersions.auto,
                  size: 220,
                ),
              ),
            ),

            const SizedBox(height: 20),

            Text(
              "Scan this QR to add store",
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ],
        ),
      ),
    );
  }
}