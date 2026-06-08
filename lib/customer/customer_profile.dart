import 'dart:io';
import 'package:codemonks_nukkad/screens/home_screen.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

import '../db/local_storage.dart';
import '../common/logger.dart';
import '../models/profile_model.dart';
import '../services/profile_service.dart';
import 'customer_dashboard.dart';
class CustomerProfile extends StatefulWidget {
  const CustomerProfile({super.key});

  @override
  State<CustomerProfile> createState() => _CustomerProfileState();
}

class _CustomerProfileState extends State<CustomerProfile> {
  ProfileModel? profile;
  bool isLoading = true;
  bool isEdit = false;

  final firstNameCtrl = TextEditingController();
  final lastNameCtrl = TextEditingController();
  final emailCtrl = TextEditingController();
  final phoneCtrl = TextEditingController();
  final dobCtrl = TextEditingController();

  File? profileImage;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    loadProfile();
    loadProfileImage();
  }
  Future<void> loadProfile() async {
    if (profile != null) return;
    final data = await ProfileService.getProfile();

    if (!mounted) return;

    if (data != null) {
      setState(() {
        profile = data;
        final parts = data.name.split(" ");

        firstNameCtrl.text = parts.isNotEmpty ? parts[0] : "";
        lastNameCtrl.text = parts.length > 1 ? parts[1] : "";
        phoneCtrl.text = data.phone;
        emailCtrl.text = data.email;
        dobCtrl.text=data.dob ;
        isLoading = false;
      });
       LocalStorageService.setUserName(profile!.name);
       LocalStorageService.setPhone(profile!.phone);
      log.i("Saved phone: ${profile!.phone}");
    }
  }

  Future <void> loadProfileImage() async {
    final prefs = await
    SharedPreferences.getInstance();
    final path = prefs.getString('profileImage');
    if (path != null) {
      setState(() {
        profileImage = File(path);
      });
    }
  }

  Future<void> saveProfile() async {

    String fullName =
        "${firstNameCtrl.text.trim()} ${lastNameCtrl.text.trim()}";

    bool success = await ProfileService.updateProfile(
      name: fullName,
      email: emailCtrl.text.trim(),
      dob: dobCtrl.text.trim(),
      profileImageUrl: null,
    );

    if (success) {
      final prefs = await SharedPreferences.getInstance();

      await prefs.setString("userName", fullName);
      await prefs.setString("email", emailCtrl.text.trim());
      await prefs.setString("phone", phoneCtrl.text.trim());

      if (!mounted) return;

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) =>
          const CustomerDashboard(showProfileUpdateMessage: true),
        ),
      );

    } else {

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Profile update failed")),
      );

    }
  }
    Future <void> pickFromGallery() async {
      final XFile? image = await _picker.pickImage(
          source: ImageSource.gallery);
      if (image != null) {
        saveImage(image.path);
      }
    }
  Future<void> pickDate() async {
    DateTime? selectedDate = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );

    if (selectedDate != null) {
      setState(() {
        dobCtrl.text =
        "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";
      });
    }
  }
  Future<void> saveImage(String path) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('profileImage', path);

    if (!mounted) return;

    setState(() {
      profileImage = File(path);
    });
  }

        void showImagePicker() {
          showModalBottomSheet(
              context: context,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(top: Radius.circular(16),),
              ),
              builder: (_) {
                return SafeArea(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ListTile(
                        leading: Icon(Icons.camera_alt),
                        onTap: () {
                          Navigator.pop(context);
                          pickFromGallery();
                        },
                      )
                    ],
                  ),
                );
              }
          );
        }
        @override
        Widget build(BuildContext context) {
          final size = MediaQuery.of(context).size;
          final width = size.width;
          return Scaffold(
            appBar: AppBar(
              title: const Text('My Profile'),
              centerTitle: true,
              actions: [
                TextButton(
                  onPressed: () {
                    if (isEdit) {
                      saveProfile();
                    } else {
                      setState(() => isEdit = true);
                    }
                  },
                  child: Text(
                    isEdit ? 'Save' : 'Edit',
                    style: const TextStyle(color: Colors.white),
                  ),
                )
              ],
            ),
            body: isLoading
                ? const Center(child: CircularProgressIndicator())
                : SafeArea(
          child: SingleChildScrollView(
          keyboardDismissBehavior:
          ScrollViewKeyboardDismissBehavior.onDrag,
            child:Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  Stack(
                    alignment: Alignment.bottomRight,
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.black,
                        backgroundImage: profileImage != null ?
                        FileImage(profileImage!) : null,
                        child: profileImage == null
                            ?
                        Icon(Icons.person, size: 60, color: Colors.white)
                            : null,
                      ),
                      if(isEdit)
                        Positioned(
                          bottom: 4,
                          right: 4,
                          child: GestureDetector(
                            onTap: showImagePicker,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Colors.black),
                              child: const Icon(Icons.camera_alt,
                                  size: 18,
                                  color: Colors.white),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 30),
                  Row(
                    children: [
                      Expanded(
                          child: profileBlock('First Name', firstNameCtrl)),
                      const SizedBox(width: 16),
                      Expanded(
                          child: profileBlock('Last Name', lastNameCtrl)),
                    ],
                  ),

                  const SizedBox(height: 24),
                  profileBlock('Email', emailCtrl),
                  const SizedBox(height: 24),
                  profileBlock('Contact Number', phoneCtrl,),
                  const SizedBox(height: 24),
                  profileBlock('Date of Birth', dobCtrl),

                  SizedBox(height: MediaQuery.of(context).size.height * 0.09),

                  if (!isEdit)
                    Padding(
                        padding: EdgeInsets.symmetric(horizontal: width * 0.05),
                   child: Row(
                      children: [
                        Expanded(
                   child: SizedBox(
                    height: width * 0.13,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              shape: RoundedRectangleBorder(
                                borderRadius:BorderRadius.circular(width * 0.08),
                              ),
                              elevation: 0,
                            ),
                            onPressed: () => setState(() => isEdit = true),
                            child: Text('Edit',
          style: TextStyle(
          fontSize: width * 0.045,
          fontWeight: FontWeight.w600,
          color: Colors.white,)),
                          ),
          )
          ),
          SizedBox(width: width * 0.03),
                        Expanded(
                      child: SizedBox(
                       height: width * 0.13,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(width * 0.08),
                              ),
                             elevation: 0,
                            ),
                            onPressed: () {
                              _showConfirmOrderDialog(context);
                            },
                            child: Text( 'Logout',
                              style: TextStyle(fontSize: width * 0.045,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),),
                          ),
                        ),
                        )],
                    )),
                  if(isEdit)
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: (){
                   saveProfile();
                       },
                          child: Text('Save Changes',
                          style: TextStyle(
                            color: Colors.white
                          ),),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: () async {
             },
                          child: Text( 'Deactivate Account',
                            style: TextStyle(
                                color: Colors.white),
                        ),
                      ),
                      )],
                  ),
                ],
              ),
            ),
          ))
          );
        }
    Widget profileBlock(String label, TextEditingController controller) {
      final size = MediaQuery.of(context).size;
      final height = size.height;
      if (isEdit) {
        return TextField(
          controller: controller,
          readOnly: label == "Date of Birth"|| label == "Contact Number",
          onTap: label == "Date of Birth" ? pickDate : null,
          decoration: InputDecoration(
            enabled: !(label == "Contact Number"),
            labelText: label,
            border: const UnderlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(vertical: 14),
          ),
        );
      } else {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 14)),
             SizedBox(height:height*0.01),
            Text(
              controller.text,
              style:  TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
             SizedBox(height: height*0.03),
            const Divider(thickness: 1),
          ],
        );
      }
    }
  void _showConfirmOrderDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) {
        return AlertDialog(
          shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text("Logout", textAlign: TextAlign.center),
          content: const Text(
            "Are you sure you want to Logout?",
            textAlign: TextAlign.center,
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20))
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text("Cancel",
                style: TextStyle(color: Colors.white),),),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20))
              ),
        onPressed: () async {
          Navigator.pop(context);
        final prefs = await SharedPreferences.getInstance();
        await prefs.clear();

        if (!context.mounted) return;

        Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
        builder: (_) => HomeScreen(),
        ),
        (route) => false,
        );
        },
              child: const Text("Logout",
                style: TextStyle(color: Colors.white),),
            ),
          ],
        );
      },
    );
  }


  @override
     void dispose() {
       firstNameCtrl.dispose();
       lastNameCtrl.dispose();
       emailCtrl.dispose();
       phoneCtrl.dispose();
       dobCtrl.dispose();
       super.dispose();
     }
  }

