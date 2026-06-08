import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:image_picker/image_picker.dart';
import '../db/local_storage.dart';
import '../models/store_model.dart';
import '../services/store_service.dart';

class AddStoreScreen extends StatefulWidget {
  const AddStoreScreen({super.key});

  @override
  State<AddStoreScreen> createState() => _AddStoreScreenState();
}

class _AddStoreScreenState extends State<AddStoreScreen> {

  final TextEditingController storeIdController = TextEditingController();
  final MobileScannerController scannerController = MobileScannerController();
  bool isScanning = true;
  Future<void> addStoreApi(String storeId) async {
    final StoreModel? response = await StoreService.addStore(storeId);

    if (response != null) {
      await LocalStorageService.saveStoreId(response.id!);

      await LocalStorageService.setStoreName(response.storeName ?? "");
      print(" SAVED STORE ID: ${response.id}");
      _showConfirmOrderDialog(
        context,
        response.storeName ?? "Unknown Store",
        response.storeQrId ?? storeId,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to add store")),
      );
    }
  }

  void onDetect(BarcodeCapture capture) {
    final List<Barcode> barcodes = capture.barcodes;

    if (barcodes.isNotEmpty && isScanning) {
      final String? code = barcodes.first.rawValue;

      if (code != null) {
        setState(() {
          isScanning = false;
          storeIdController.text = code;
        });

        scannerController.stop();

        addStoreApi(code);
      }
    }
  }
  Future<void> pickImageFromGallery() async {
    final ImagePicker picker = ImagePicker();
    await picker.pickImage(source: ImageSource.gallery);
  }

  @override
  void dispose() {
    scannerController.dispose();
    storeIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      appBar: AppBar(
        title: const Text("Add Store"),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: Colors.black,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              elevation: 4,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [

                    const Text(
                      "Scan QR to Add Store",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 20),
                    Container(
                      height: 250,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(25),
                        color: Colors.black,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(25),
                        child: MobileScanner(
                          controller: scannerController,
                          onDetect: onDetect,
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    const Text(
                      "OR",
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 15),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade100,
                        foregroundColor: Colors.green,
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 0,
                      ),
                      onPressed: pickImageFromGallery,
                      icon: const Icon(Icons.image),
                      label: const Text(
                        "Select QR from Gallery",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 25),

            const Text(
              "OR",
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 25),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
              ),
              elevation: 3,
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    const Text(
                      "Add Store By Id",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    const SizedBox(height: 20),

                    TextField(
                      controller: storeIdController,
                      decoration: InputDecoration(
                        prefixText: "NKS",
                        hintText: "Enter Store ID",
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 16,
                          horizontal: 20,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                    ),

                    const SizedBox(height: 20),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          minimumSize: const Size(double.infinity, 55),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        onPressed: () {
                          String id = storeIdController.text.trim();
                          if (id.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text("Enter Store ID")),
                            );
                            return;
                          }
                          if (!id.startsWith("NKS")) {
                            id = "NKS$id";
                          }

                          addStoreApi(id);
                        },
                        child: const Text(
                          "Add Store",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                                color: Colors.white
                          ),
                        ),
                      ),
                    )
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showConfirmOrderDialog(
      BuildContext context,
      String storeName,
      String storeQrId,
      ) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
          content: Text(
            "Store Name: $storeName\nStore ID: $storeQrId",
          ),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Skip"),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                Navigator.of(this.context).pop(storeName);
              },
              child: const Text("Add"),
            ),
          ],
        );
      },
    );
  }
}
