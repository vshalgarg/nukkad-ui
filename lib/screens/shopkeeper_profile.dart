import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../common/logger.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/shopkeeper_profile_model.dart';
import '../services/shopkeeper_profile_service.dart';
import '../state_city_data/state_city.dart';
import '../shopkeeper/shopkeeper_dashboard.dart';
import '../screens/home_screen.dart';

class StoreDetailScreen extends StatefulWidget {
  const StoreDetailScreen({super.key});

  @override
  State<StoreDetailScreen> createState() => _StoreDetailScreenState();
}

class _StoreDetailScreenState extends State<StoreDetailScreen> {
  StorekeeperModel? profile;
  bool isLoading = true;
  bool isEditing = false;
  bool isUpdating = false;

  final nameController = TextEditingController();
  final storeNameController = TextEditingController();
  final contactController = TextEditingController();
  final gstController = TextEditingController();
  final qrController = TextEditingController();
  final address1Controller = TextEditingController();
  final address2Controller = TextEditingController();
  final landmarkController = TextEditingController();
  final pincodeController = TextEditingController();

  String? selectedState;
  String? selectedCity;

  List<File?> storeImages = [null, null, null];
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    loadProfile();
  }

  Future<void> loadProfile() async {
    final data = await ShopkeeperService.getProfile();
    if (data != null) {
      setState(() {
        profile = data;
        nameController.text = data.name;
        storeNameController.text = data.storeName;
        contactController.text = data.contactNumber;
        gstController.text = data.gstNum;
        qrController.text = data.storeQrId;
        address1Controller.text = data.addressLine1;
        address2Controller.text = data.addressLine2;
        landmarkController.text = data.landmark;
        pincodeController.text = data.pincode;
        selectedState = data.state;
        selectedCity = data.city;
        isLoading = false;
      });
    }
  }

  Future<void> pickImage(int index) async {
    final XFile? image =
    await _picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      setState(() {
        storeImages[index] = File(image.path);
      });
    }
  }

  Future<String> uploadImage(File file) async {
    log.d("Uploading image: ${file.path}");

    final fileName = "store_${DateTime.now().millisecondsSinceEpoch}_${file.hashCode}.jpg";

    final ref = FirebaseStorage.instance
        .ref()
        .child("profile_images/$fileName");

    await ref.putFile(file);

    final url = await ref.getDownloadURL();

    log.d("IMAGE URL: $url");

    return url;
  }
    Future<List<String>> uploadImages() async {
      return await Future.wait(
        storeImages
            .where((img) => img != null)
            .map((img) => uploadImage(img!)),
      );
    }


  Future<void> handleUpdate() async {

    List<String> imageUrls = profile?.imageUrls ?? [];

    final newUrls = await uploadImages();

    int newIndex = 0;

    for (int i = 0; i < storeImages.length; i++) {
      if (storeImages[i] != null) {
        if (imageUrls.length > i) {
          imageUrls[i] = newUrls[newIndex]; // replace existing
        } else {
          imageUrls.add(newUrls[newIndex]); // add new
        }
        newIndex++;
      }
    }

    final success = await ShopkeeperService.updateProfile(
      name: nameController.text,
      storeName: storeNameController.text,
      contactNumber: contactController.text,
      gstNum: gstController.text,
      storeQrId: qrController.text,
      addressLine1: address1Controller.text,
      addressLine2: address2Controller.text,
      landmark: landmarkController.text,
      state: selectedState ?? "Haryana",
      city: selectedCity ?? "Fatehabad",
      pincode: pincodeController.text,
      imageUrls: imageUrls,
    );

    setState(() => isUpdating = false);

    if (success) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('shopkeeper_name', nameController.text);
      await prefs.setString('shopkeeper_store_name', storeNameController.text);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile Updated")),
      );

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const ShopkeeperDashboard()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final height = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: Colors.grey.shade200,
      appBar: AppBar(
        leading: IconButton(
          onPressed: () {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const ShopkeeperDashboard()),
            );
          },
          icon: const Icon(Icons.arrow_back_ios),
        ),
        title: const Text("Store Details"),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(width * 0.05),
          child: Column(
            children: [
              sectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    sectionTitle("Store Information"),
                    buildField("Name", nameController),
                    buildField("Store Name", storeNameController),
                    buildField("Contact Number", contactController),
                    buildField("GST Number", gstController),
                    buildField("Store QR ID", qrController),
                  ],
                ),
              ),
              sectionCard(
                child: Column(
                  children: [
                    centeredTitle("Address Details"),
                    buildField("Address Line 1", address1Controller),
                    buildField("Address Line 2", address2Controller),
                    buildField("Landmark", landmarkController),
                    underlineDropdown(
                      label: "State",
                      value: selectedState,
                      items: stateCityList.map((e) => e.stateName).toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedState = value;
                          selectedCity = null;
                        });
                      },
                    ),
                    SizedBox(height: height * 0.02),
                    underlineDropdown(
                      label: "City",
                      value: selectedCity,
                      items: selectedState == null
                          ? []
                          : stateCityList
                          .firstWhere((e) => e.stateName == selectedState)
                          .cities,
                      onChanged: (value) {
                        setState(() => selectedCity = value);
                      },
                    ),
                    buildField("Pincode", pincodeController),
                  ],
                ),
              ),
              sectionCard(
                child: Column(
                  children: [
                    centeredTitle("Store Images"),
                    SizedBox(height: height * 0.02),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        imageBox(0, width),
                        imageBox(1, width),
                        imageBox(2, width),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: height * 0.1),
            ],
          ),
        ),
      ),
      bottomNavigationBar: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: width * 0.03,
          vertical: height * 0.04,
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton(
                onPressed: () async {
                  if (isEditing) {
                    await handleUpdate();
                  } else {
                    setState(() => isEditing = true);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  padding: EdgeInsets.symmetric(vertical: height * 0.02),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: isUpdating
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(isEditing ? "Save" : "Edit",
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ),
            SizedBox(width: width * 0.02),
            Expanded(
              child: ElevatedButton(
                onPressed: () => _showConfirmOrderDialog(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  padding: EdgeInsets.symmetric(vertical: height * 0.02),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: const Text(
                  "Logout",
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget imageBox(int index, double width) {
    return GestureDetector(
      onTap: isEditing ? () => pickImage(index) : null,
      child: Container(
        height: width * 0.25,
        width: width * 0.25,
        decoration: BoxDecoration(
          border: Border.all(),
          image: storeImages[index] != null
              ? DecorationImage(
            image: FileImage(storeImages[index]!),
            fit: BoxFit.cover,
          ) : (profile != null &&
              profile!.imageUrls.length > index)
              ? DecorationImage(
            image: NetworkImage(profile!.imageUrls[index]),
            fit: BoxFit.cover,
          ) : null,
        ),
        child: const Icon(Icons.image),
      ),
    );
  }

  Widget buildField(String label, TextEditingController controller) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: TextField(
        controller: controller,
        enabled: isEditing,
        decoration: InputDecoration(
          labelText: label,
          border: const UnderlineInputBorder(),
        ),
      ),
    );
  }

  Widget sectionCard({required Widget child}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: EdgeInsets.all(MediaQuery.of(context).size.width * 0.04),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: child,
    );
  }

  Widget sectionTitle(String text) =>
      Text(text, style: const TextStyle(fontWeight: FontWeight.bold));

  Widget centeredTitle(String text) =>
      Text(text, style: const TextStyle(fontWeight: FontWeight.bold));

  Widget underlineDropdown({
    required String label,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: items.contains(value) ? value : null,
      hint: Text("Select $label"),
      items: items
          .map((item) => DropdownMenuItem(value: item, child: Text(item)))
          .toList(),
      onChanged: isEditing ? onChanged : null,
    );
  }
}

void _showConfirmOrderDialog(BuildContext context) {
  showDialog(
    context: context,
    builder: (_) {
      return AlertDialog(
        title: const Text("Logout"),
        content: const Text("Are you sure you want to Logout?"),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => HomeScreen()),
              );
            },
            child: const Text("Logout"),
          ),
        ],
      );
    },
  );
}