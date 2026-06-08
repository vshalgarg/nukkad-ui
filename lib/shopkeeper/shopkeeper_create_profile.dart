import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../common/logger.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'shopkeeper_create_profile_service.dart';
import '../state_city_data/state_city.dart';
import '../widgets/custom_text_field.dart';
import '../db/local_storage.dart';
import 'shopkeeper_dashboard.dart';

class ShopkeeperForm extends StatefulWidget {
  final int userId;
  const ShopkeeperForm({super.key,required this.userId});

  @override
  State<ShopkeeperForm> createState() => _ShopkeeperFormState();
}

class _ShopkeeperFormState extends State<ShopkeeperForm> {

  final _formKey = GlobalKey<FormState>();

  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController storeNameCtrl = TextEditingController();
  final TextEditingController numberCtrl = TextEditingController();
  final TextEditingController gstCtrl = TextEditingController();
  final TextEditingController address1Ctrl = TextEditingController();
  final TextEditingController address2Ctrl = TextEditingController();
  final TextEditingController landmarkCtrl = TextEditingController();
  final TextEditingController pincodeCtrl = TextEditingController();

  String? selectedState;
  String? selectedCity;
  bool isLoading = false;

  final ImagePicker _picker = ImagePicker();
  List<XFile> shopImages = [];

  Future<void> pickImageFromGallery() async {
    final List<XFile> images = await _picker.pickMultiImage();
    if (images.isNotEmpty) {
      setState(() {
        shopImages.addAll(images);
      });
    }
  }

  Future<void> pickImageFromCamera() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() {
        shopImages.add(image);
      });
    }
  }

  void removeImage(int index) {
    setState(() {
      shopImages.removeAt(index);
    });
  }
  Future<String> uploadImage(File file) async {
    final fileName = "store_${DateTime.now().millisecondsSinceEpoch}.jpg";

    final ref = FirebaseStorage.instance
        .ref()
        .child("profile_images/$fileName");

    await ref.putFile(file);

    return await ref.getDownloadURL();
  }
  Future<void> saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => isLoading = true);

    try {
      List<String> imageUrls = [];

      for (var img in shopImages) {
        final url = await uploadImage(File(img.path));
        imageUrls.add(url);
      }

      final body = {
        "name": nameCtrl.text.trim(),
        "storeName": storeNameCtrl.text.trim(),
        "contactNumber": numberCtrl.text.trim(),
        "gstNum": gstCtrl.text.trim(),
        "addressLine1": address1Ctrl.text.trim(),
        "addressLine2": address2Ctrl.text.trim(),
        "landmark": landmarkCtrl.text.trim(),
        "city": selectedCity,
        "state": selectedState,
        "pincode": pincodeCtrl.text.trim(),
        "imageUrls": imageUrls
      };

      final success = await ShopkeeperService.createStorekeeper(body);

      if (success) {
        final prefs = await SharedPreferences.getInstance();

        await prefs.setString(
          'shopkeeper_name',
          nameCtrl.text.trim(),
        );

        await prefs.setString(
          'shopkeeper_store_name',
          storeNameCtrl.text.trim(),
        );
        LocalStorageService.setProfileCompleted(true);
        LocalStorageService.setUserName(nameCtrl.text.trim());
        LocalStorageService.setStoreName(storeNameCtrl.text.trim());

        if (!mounted) return;

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => const ShopkeeperDashboard(),
          ),
        );

      } else {

        throw Exception("Shopkeeper creation failed");

      }

    } catch (e) {

      log.e("CREATE SHOPKEEPER ERROR: $e");

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );

    }

    setState(() => isLoading = false);

  }
  Widget buildLabel(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: RichText(
        text: TextSpan(
          text: text,
          style: const TextStyle(
            color: Colors.black,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          children: required
              ? const [
            TextSpan(
              text: ' *',
              style: TextStyle(color: Colors.red),
            )
          ]
              : [],
        ),
      ),
    );
  }

  Widget customDropdown({
    required String hint,
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      hint: Text(hint),
      items: items
          .map((item) =>
          DropdownMenuItem(value: item, child: Text(item)))
          .toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        contentPadding:
        const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
    );
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(40),
                bottomRight: Radius.circular(40),
              ),
            ),
            alignment: Alignment.center,
            child: const Text(
              'My Profile',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    buildLabel('Storekeeper Name', required: true),
                    CustomTextField(
                      hint: 'Enter name',
                      controller: nameCtrl,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Name', required: true),
                    CustomTextField(
                      hint: 'Enter store name',
                      controller: storeNameCtrl,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Contact Number', required: true),
                    CustomTextField(
                      hint: 'Enter number',
                      controller: numberCtrl,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('GST IN', required: true),
                    CustomTextField(
                      hint: 'GST number',
                      controller: gstCtrl,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Address Line 1', required: true),
                    CustomTextField(
                      hint: 'Address line 1',
                      controller: address1Ctrl,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Address Line 2'),
                    CustomTextField(
                      hint: 'Address line 2',
                      controller: address2Ctrl,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Landmark', required: true),
                    CustomTextField(
                      hint: 'Landmark',
                      controller: landmarkCtrl,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store State', required: true),
                    customDropdown(
                      hint: 'Select State',
                      value: selectedState,
                      items: stateCityList
                          .map((e) => e.stateName)
                          .toList(),
                      onChanged: (value) {
                        setState(() {
                          selectedState = value;
                          selectedCity = null;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store City', required: true),
                    customDropdown(
                      hint: 'Select City',
                      value: selectedCity,
                      items: selectedState == null
                          ? []
                          : stateCityList
                          .firstWhere((e) =>
                      e.stateName == selectedState)
                          .cities,
                      onChanged: (value) {
                        setState(() {
                          selectedCity = value;
                        });
                      },
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Pincode', required: true),
                    CustomTextField(
                      hint: 'Pincode',
                      controller: pincodeCtrl,
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 16),
                    buildLabel('Store Image', required: true),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: pickImageFromGallery,
                            icon: const Icon(Icons.photo_library_outlined),
                            label: const Text('Gallery'),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: pickImageFromCamera,
                            icon: const Icon(Icons.camera_alt_outlined),
                            label: const Text('Camera'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    shopImages.isEmpty
                        ? const Text(
                      'No images selected',
                      style: TextStyle(color: Colors.grey),
                    )
                        : GridView.builder(
                      shrinkWrap: true,
                      physics:
                      const NeverScrollableScrollPhysics(),
                      itemCount: shopImages.length,
                      gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                      ),
                      itemBuilder: (context, index) {
                        return Stack(
                          children: [
                            ClipRRect(
                              borderRadius:
                              BorderRadius.circular(12),
                              child: Image.file(
                                File(shopImages[index].path),
                                fit: BoxFit.cover,
                                width: double.infinity,
                                height: double.infinity,
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: GestureDetector(
                                onTap: () =>
                                    removeImage(index),
                                child: const CircleAvatar(
                                  radius: 12,
                                  backgroundColor:
                                  Colors.black54,
                                  child: Icon(
                                    Icons.close,
                                    size: 14,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: saveProfile,
                      child: const Center(
                        child: Text('Continue'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
