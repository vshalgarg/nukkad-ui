import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../db/local_storage.dart';
import '../models/qr_model.dart';
import '../services/qr_service.dart';

class PaymentOptionScreen extends StatefulWidget {
  const PaymentOptionScreen({super.key});

  @override
  State<PaymentOptionScreen> createState() => _PaymentOptionScreenState();
}

class _PaymentOptionScreenState extends State<PaymentOptionScreen> {
  List<QRModel> qrList = [];
  List<bool> isBlurred = [true, true, true];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    initSlots();
  }

  Future<void> initSlots() async {
    final savedList = await LocalStorageService.getQRList();

    if (savedList != null && savedList.isNotEmpty) {
      qrList = savedList;
    } else {
      qrList = List.generate(
        3,
            (index) => QRModel(id: "", imageUrl: "", isDefault: false),
      );
    }

    isLoading = false;
    setState(() {});
  }

  Future<void> pickAndUpload(QRModel qr, int index) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 50,
    );

    if (picked == null) return;

    File file = File(picked.path);
    String base64 = base64Encode(await file.readAsBytes());

    setState(() {
      qrList[index] = QRModel(
        id: qr.id.isNotEmpty ? qr.id : "local_$index",
        imageUrl: base64,
        isDefault: false,
      );
      isBlurred[index] = true;
    });

    await LocalStorageService.saveQRList(qrList);

    if (qr.id.isNotEmpty && !qr.id.startsWith("local_")) {
      await QRService.updateQR(qr.id, file);
    }
  }

  Widget qrImage(String url, int index) {
    if (url.isEmpty) {
      return const Icon(Icons.qr_code_2, size: 60);
    }

    return GestureDetector(
      onTap: () => openFullScreen(url),
      child: Stack(
        alignment: Alignment.center,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.memory(
              base64Decode(url),
              height: 120,
              width: 120,
              fit: BoxFit.cover,
            ),
          ),
          Container(
            height: 120,
            width: 120,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.6),
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          const Icon(Icons.visibility, size: 30),
        ],
      ),
    );
  }

  void openFullScreen(String base64) {
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
              child: Image.memory(base64Decode(base64)),
            ),
          ),
        ),
      ),
    );
  }

  Widget qrCard(QRModel qr, int index) {
    bool hasImage = qr.imageUrl.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            blurRadius: 10,
            color: Colors.grey.shade200,
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Text(
                "QR Code ${index + 1}",
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (qr.isDefault)
                const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child: Text(
                    "(Default)",
                    style: TextStyle(color: Colors.green),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => pickAndUpload(qr, index),
            child: Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Center(
                child: hasImage
                    ? qrImage(qr.imageUrl, index)
                    : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.qr_code_2, size: 40),
                    SizedBox(height: 10),
                    Text("Select QR To Upload"),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (hasImage)
            qr.isDefault
                ? SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                onPressed: null,
                child: const Text("Default"),
              ),
            )
                : Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    onPressed: () async {
                      setState(() {
                        for (int i = 0; i < qrList.length; i++) {
                          qrList[i] = QRModel(
                            id: qrList[i].id,
                            imageUrl: qrList[i].imageUrl,
                            isDefault: i == index,
                          );
                        }
                      });

                      await LocalStorageService.saveQRList(qrList);

                      if (qr.id.isNotEmpty) {
                        await QRService.markDefaultQR(qr.id);
                      }
                    },
                    child: const Text("Set as Default",style: TextStyle(
                        color: Colors.white
                    ),),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
                    onPressed: () async {
                      bool? confirm = await showDialog(
                        context: context,
                        builder: (_) => AlertDialog(
                          title: const Text("Delete QR"),
                          content: const Text(
                              "Are you sure you want to delete this QR?"),
                          actions: [
                            TextButton(
                              onPressed: () =>
                                  Navigator.pop(context, false),
                              child: const Text("Cancel"),
                            ),
                            TextButton(
                              onPressed: () =>
                                  Navigator.pop(context, true),
                              child: const Text("Delete"),
                            ),
                          ],
                        ),
                      );

                      if (confirm == true) {
                        if (qr.id.isNotEmpty &&
                            !qr.id.startsWith("local_")) {
                          await QRService.deleteQR(qr.id);
                        }

                        setState(() {
                          qrList[index] = QRModel(
                            id: "",
                            imageUrl: "",
                            isDefault: false,
                          );
                          isBlurred[index] = true;
                        });

                        await LocalStorageService.saveQRList(qrList);
                      }
                    },
                    icon: const Icon(Icons.delete,color: Colors.white,),
                    label: const Text("Delete",style: TextStyle(
                        color: Colors.white)),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text("Payment Options"),
        centerTitle: true,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: qrList
              .asMap()
              .entries
              .map((e) => qrCard(e.value, e.key))
              .toList(),
        ),
      ),
    );
  }
}