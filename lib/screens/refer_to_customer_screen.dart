import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';

import '../db/local_storage.dart';
import '../services/store_storage.dart';

class ReferToCustomerScreen extends StatefulWidget {
  const ReferToCustomerScreen({super.key});

  @override
  State<ReferToCustomerScreen> createState() =>
      _ReferToCustomerScreenState();
}

class _ReferToCustomerScreenState extends State<ReferToCustomerScreen> {

  String storeName = "Select Store";
  String selectedStoreId = "";

  List<String> storeList = [];
  bool isDropdownOpen = false;

  @override
  void initState() {
    super.initState();
    loadStore();
  }

  Future<void> loadStore() async {
    final savedStores = await StoreStorage.getStores();
    final storeQrId = await LocalStorageService.getStoreQrId();

    setState(() {
      storeList = savedStores;
      if (savedStores.isNotEmpty) {
        storeName = savedStores.last;
      }

      selectedStoreId = storeQrId ?? "";
    });
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final height = MediaQuery.of(context).size.height;

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

      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: [

            const SizedBox(height: 20),

            const Align(
              alignment: Alignment.centerLeft,
              child: Text(
                "Select store to share",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,

                ),
              ),
            ),

            const SizedBox(height: 10),
            Column(
              children: [
                GestureDetector(
                  onTap: () {
                    setState(() {
                      isDropdownOpen = !isDropdownOpen;
                    });
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      border: Border.all(
                          color: Colors.grey.shade300, width: 1.5),
                      borderRadius: BorderRadius.circular(12),
                      color: Colors.white,
                    ),
                    child: Row(
                      mainAxisAlignment:
                      MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          storeName,
                          style: const TextStyle(fontSize: 16),
                        ),
                        Icon(isDropdownOpen
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down),
                      ],
                    ),
                  ),
                ),
                if (isDropdownOpen)
                  Container(
                    width: double.infinity,
                    height: storeList.length * 50.0,
                    margin: EdgeInsets.only(top: height * 0.008),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black12,
                          blurRadius: 6,
                        )
                      ],
                    ),
                    child: ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: storeList.length,
                      itemBuilder: (context, index) {
                        final store = storeList[index];

                        return InkWell(
                          onTap: () async {
                            final storeQrId =
                            await LocalStorageService.getStoreQrId();

                            setState(() {
                              storeName = store;
                              selectedStoreId = storeQrId ?? "";
                              isDropdownOpen = false;
                            });
                          },
                          child: Container(
                            padding: EdgeInsets.symmetric(
                                horizontal: width * 0.04,
                                vertical: height * 0.015),
                            child: Text(
                              store,
                              style: TextStyle(fontSize: width * 0.04),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),

            SizedBox(height: height * 0.04),
            Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 10),
             child:  Text(
              storeName,
              style: TextStyle(
                fontSize: width * 0.06,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            ),
            SizedBox(height: height * 0.025),
            Container(
              padding: EdgeInsets.all(width * 0.03),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 6,
                  )
                ],
              ),
              child: QrImageView(
                data: selectedStoreId.isEmpty
                    ? "No Store Selected"
                    : selectedStoreId,
                version: QrVersions.auto,
                size: width * 0.6,
              ),
            ),

            SizedBox(height: height * 0.02),
            RichText(
              text: TextSpan(
                style: TextStyle(fontSize: width * 0.045),
                children: [
                  const TextSpan(
                    text: "Store ID: ",
                    style: TextStyle(color: Colors.black),
                  ),
                  TextSpan(
                    text: selectedStoreId,
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),

            const Spacer(),
            SizedBox(
              width: width*0.5,
              height: height * 0.055,
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
                child: Text(
                  "Share",
                  style: TextStyle(
                    fontSize: width * 0.045,
                    fontWeight: FontWeight.w600,
                        color: Colors.white
                  ),
                ),
              ),
            ),

            SizedBox(height: height * 0.08),
          ],
        ),
      ),
    );
  }
}