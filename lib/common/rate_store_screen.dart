import 'package:flutter/material.dart';
import '../customer/customer_dashboard.dart';
import '../db/local_storage.dart';
import '../services/rating_service.dart';
import '../services/store_storage.dart';
class RateStoreScreen extends StatefulWidget{
  const RateStoreScreen({super.key,});

  @override
  State<RateStoreScreen> createState() => _RateStoreScreenState();
}

class _RateStoreScreenState extends State<RateStoreScreen> {
  bool isSubmitting = false;
  int selectedRating = 0;
  final TextEditingController
  feedbackController = TextEditingController();
  final int maxLength = 500;
  String storeName = "Select Store";

  void _showConfirmOrderDialog( ) {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) {
        return AlertDialog(
          shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
          title: Center(child: Text("Thank You")),
          content: const Text(
              "We appreciate your feedback.\n"
                  "It helps us improve your experience."
          ),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                if (!mounted) return;
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (_) => const CustomerDashboard()),
                );
              },
              child: Center(child: const Text("Done")),
            ),
          ],
        );
      },
    );
  }
  @override
  void initState() {
    super.initState();
    loadStore();
  }

  Future<void> loadStore() async {
    final savedStores = await StoreStorage.getStores();

    if (savedStores.isNotEmpty) {
      setState(() {
        storeName = savedStores.first;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final height = MediaQuery.of(context).size.height;
    return Scaffold(
        backgroundColor: Colors.grey.shade200,
        appBar: AppBar(
          backgroundColor: Colors.grey.shade200,
          elevation: 0,
          centerTitle: true,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            "Rate Store",
            style: TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: width * 0.05),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: height * 0.9),
              child: IntrinsicHeight(
                child: Column(
                  children: [

                    SizedBox(height: height * 0.04),
                    Text(
                      storeName,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: width * 0.06,
                        fontWeight: FontWeight.bold,
                      ),
                    ),

                    SizedBox(height: height * 0.04),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (index) {
                        return IconButton(
                          iconSize: width * 0.1,
                          onPressed: () {
                            setState(() {
                              selectedRating = index + 1;
                            });
                          },
                          icon: Icon(
                            Icons.star,
                            color: index < selectedRating
                                ? Colors.orange
                                : Colors.grey,
                          ),
                        );
                      }),
                    ),

                    SizedBox(height: height * 0.03),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: width * 0.04),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(15),
                        border: Border.all(color: Colors.black54),
                        color: Colors.white,
                      ),
                      child: TextField(
                        controller: feedbackController,
                        maxLength: maxLength,
                        maxLines: 5,
                        decoration: const InputDecoration(
                          hintText: "Write your feedback here...",
                          border: InputBorder.none,
                          counterText: "",
                        ),
                        onChanged: (value) {
                          setState(() {});
                        },
                      ),
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Text(
                        "${feedbackController.text.length}/$maxLength",
                        style: TextStyle(
                          color: Colors.grey,
                          fontSize: width * 0.035,
                        ),
                      ),
                    ),

                    const Spacer(),
                    SizedBox(
                      width: width*0.6,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                        ),
                        onPressed: () async {
                          if (selectedRating == 0) {
                            showTopError(context, "Please rate the store");
                            return;
                          }
                          final storeId =  LocalStorageService.getStoreId();
                          if (!mounted) return;
                          if (storeId == null) {
                            showTopError(context, "Store not selected");
                            return;
                          }
                          setState(() => isSubmitting = true);
                          bool success = await RatingService.createRating(
                            storeKeeperId: storeId,
                            review: feedbackController.text,
                            rating: selectedRating,
                          );
                          if (!mounted) return;
                          setState(() => isSubmitting = false);
                          if (success) {
                            _showConfirmOrderDialog();
                          } else {
                            showTopError(context, "Failed to submit rating");
                          }
                        },
                        child:isSubmitting
                            ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                        :Text(
                          "Submit Review",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: width * 0.045,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),

                    SizedBox(height: height * 0.09),
                  ],
                ),
              ),
            ),
          ),
        )
    );
  }
}
void showTopError(BuildContext context, String message) {
  if (!context.mounted) return;
  final overlay = Overlay.of(context);

  final overlayEntry = OverlayEntry(
    builder: (context) =>
        Positioned(
          top: MediaQuery
              .of(context)
              .padding
              .top + 10,
          left: 16,
          right: 16,
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(color: Colors.black26, blurRadius: 6),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 5,
                    height: 30,
                    decoration: BoxDecoration(
                      color: Colors.red,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      message,
                      style: const TextStyle(
                        color: Colors.red,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
  );

  overlay.insert(overlayEntry);

  Future.delayed(const Duration(seconds: 2), () {
    overlayEntry.remove();
  });
}


