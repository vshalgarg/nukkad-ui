
import 'dart:core';
import 'dart:io';
import 'package:codemonks_nukkad/common/rate_store_screen.dart';
import 'package:codemonks_nukkad/screens/refer_to_customer_screen.dart';
import '../common/logger.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../common/app_links.dart';
import '../db/local_storage.dart';
import '../providers/cart_provider.dart';
import 'package:codemonks_nukkad/customer/order_history_screen.dart';
import '../services/profile_service.dart';
import 'add_store_screen.dart';
import 'address_screen.dart';
import 'my_store_screen.dart';
import 'package:flutter/material.dart';
import '../screens/product_list_screen.dart';
import 'shopping_cart_screen.dart';
import '../services/category_services.dart';
import '../services/store_storage.dart';
import 'customer_profile.dart';
import '../models/category_model.dart';
class CustomerDashboard extends StatefulWidget {
  final bool showProfileUpdateMessage;
  final String? userName;
  final String? phone;

  const CustomerDashboard({
    super.key,
    this.showProfileUpdateMessage = false,
    this.userName,
    this.phone,
  });

  @override
  State<CustomerDashboard> createState() => _CustomerDashboardState();
}

class _CustomerDashboardState extends State<CustomerDashboard> {
  String userName = "";
  String mobileNumber = "";
  String storeName = "Select Store";
  String profileImage = "";
  List<CategoryModel> categories = [];
  bool isLoading = true;

  Future<void> loadStore() async {
    final savedStores = await StoreStorage.getStores();
    if (savedStores.isNotEmpty) {
      setState(() {
        storeName = savedStores.first;
      });
    }
  }

  Future<void> loadProfileData() async {
    final profile = await ProfileService.getProfile();
    final prefs = await SharedPreferences.getInstance();
    final localImage = prefs.getString('profileImage');

    if (!mounted) return;

    if (profile != null) {
      LocalStorageService.setUserName(profile.name );
      LocalStorageService.setPhone(profile.phone);

      setState(() {
        userName = profile.name;
        mobileNumber = profile.phone ;
        profileImage = localImage ?? "";
      });
      log.i("Dashboard Loaded Name: ${profile.name}");
      log.i("Dashboard Loaded Phone: ${profile.phone}");
      log.i("FULL PROFILE: $profile");
      log.i("IMAGE FIELD: ${profile.image}");
    }
  }

  Future<void> loadCategories() async {
    try {
      final data = await CategoryService.getAllCategories();
      setState(() {
        categories = data;
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }


  @override
  void initState() {
    super.initState();
    userName = widget.userName ?? "User";
    mobileNumber = widget.phone ?? "Not Available";
    loadProfileData();
    loadCategories();
    loadStore();

    if (widget.showProfileUpdateMessage) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile Updated Successfully'),
            backgroundColor: Colors.green,
          ),
        );
      });
    }
  }


  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final width = size.width;
    return Scaffold(
      appBar: AppBar(
          titleSpacing: 0,
          title: GestureDetector(
            onTap: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const MyStoreScreen(),
                ),
              );

              if (result != null) {
                setState(() {
                  storeName = result.storeName ?? "Select Store";
                });
              }

            },
            child: Row(
              children: [
                const Icon(Icons.storefront_outlined, size: 20),
                const SizedBox(width: 10),
                Text(storeName),
              ],
            ),
          ),
          actions: [
            Consumer<CartProvider>(
              builder: (context, cartProvider, _) {
                return Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.shopping_cart_outlined),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const ShoppingCartScreen(),
                          ),
                        );
                      },
                    ),

                    if (cartProvider.itemCount > 0)
                      Positioned(
                        right: 4,
                        top: 4,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Text(
                            cartProvider.itemCount.toString(),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ]),
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child:SingleChildScrollView(
          child: Column(
            children: [
              Padding(
                padding: EdgeInsets.all(width * 0.03),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Search here for anything you want...',
                    fillColor: Colors.white,
                    prefixIcon: Icon(Icons.search),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: BorderSide(
                        color: Colors.grey.shade400,
                        width: 1.5,
                    ),
                  ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: const BorderSide(
                        color: Colors.green,
                        width: 2,
                      ),
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onSubmitted: (value) {
                    if (value.trim().isEmpty) return;

                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ProductListScreen(
                          categoryId: 0,
                          categoryTitle: "Search",
                          searchKeyword: value,
                        ),
                      ),
                    );
                  },
                ),
              ),
              isLoading
                  ? const Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(),
              )
                  : buildCategoryGrid(),
            ],
          ),
        ),
      ),
      drawer:  NavigationDrawer(
        key: ValueKey(profileImage),
        name: userName,
        mobile: mobileNumber,
        image: profileImage,
          onProfileUpdated:loadProfileData,
      ),

    );
  }

  Widget buildCategoryGrid() {
    final width = MediaQuery.of(context).size.width;
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.symmetric(horizontal: width * 0.04),
      itemCount: categories.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.9,
      ),
      itemBuilder: (context, index) {
        final category = categories[index];

        return GestureDetector(
          onTap: () {
            _onCategoryTap(context, category);
          },
          child: Column(
            children: [
              Expanded(
                child: category.imageUrl != null && category.imageUrl.isNotEmpty
                    ? ClipRRect(
                  borderRadius: BorderRadius.circular(width * 0.03),
                  child: Image.network(
                    category.imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      log.e("Image error: $error");
                      return const Icon(Icons.broken_image);
                    },
                  ),
                )
                    : const Icon(Icons.image),
              ),
              SizedBox(height: width * 0.02),
              Text(
                category.name,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: width * 0.045,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  void _onCategoryTap(BuildContext context,
      CategoryModel category) {
    Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) =>
              ProductListScreen(
                categoryTitle: category.name,
                categoryId: category.id,),));
  }
}

class NavigationDrawer extends StatelessWidget {
  final String name;
  final String mobile;
  final String image;
  final VoidCallback onProfileUpdated;
  const NavigationDrawer({
    super.key,
    required this.name,
    required this.mobile,
    required this.image,
    required this.onProfileUpdated,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SingleChildScrollView(
      child: Column(
              children: [
                buildHeader(context),
                buildMenuItems(context),
                  ],
                )
            ),
          );
  }

  Widget buildHeader(BuildContext context) =>
      Container(
          color: Colors.white,
          padding: EdgeInsets.only(
            top: 24 + MediaQuery
                .of(context)
                .padding
                .top,
            bottom: 24,
            left: 16,
            right: 16,
          ),
          child: Row(
            children: [
              CircleAvatar(
                  radius: 30,
                backgroundColor: Colors.grey.shade200,
                backgroundImage:
                image.isNotEmpty ? FileImage(File(image)) : null,
                child: image.isEmpty
                    ? const Icon(Icons.perm_identity_rounded)
                    : null,
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 14,)),
                    const SizedBox(height: 1),
                    Text(mobile,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                            color: Colors.grey)
                    ),
                  ],
                ),
              ),
              IconButton(onPressed: () async {
                final result = await Navigator.push(context, MaterialPageRoute(
                    builder: (_) => CustomerProfile()));

                if (result == true) {
                  onProfileUpdated();
                }
              },
                  icon: Icon(Icons.settings,
                  color: Colors.grey,)),
            ],
          )
      );

  Widget buildMenuItems(BuildContext context) =>
      Column(
              children: [
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.medical_services_rounded),
                  title: const Text('My Orders',
                      style: TextStyle(fontSize: 17,
                         )),
                  trailing: Icon(Icons.arrow_forward_ios, size: 15),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) =>
                        OrderHistoryScreen()));
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                    dense: true,
                    visualDensity: VisualDensity(vertical: -2),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12),
                    leading: const Icon(Icons.storefront),
                    title: const Text(
                        'My Stores', style: TextStyle(fontSize: 17,)),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 15),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MyStoreScreen(),
                        ),
                      );
                    }
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                    dense: true,
                    visualDensity: VisualDensity(vertical: -2),
                    contentPadding: EdgeInsets.symmetric(horizontal: 12),
                    leading: const Icon(Icons.add_circle_rounded),
                    title: const Text(
                        'Add Store', style: TextStyle(fontSize: 17,)),
                    trailing: const Icon(Icons.arrow_forward_ios, size: 15),
                    onTap: () {
                      Navigator.pop(context);
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const AddStoreScreen(),
                        ),
                      );
                    }
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.location_on),
                  title: const Text(
                      'Addresses', style: TextStyle(fontSize: 17,)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) =>
                        AddressScreen()));
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: Icon(Icons.share),
                  title: Text('Refer a Store', style: TextStyle(fontSize: 17,)),
                  trailing: Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    Share.share('Start Shopping On Nukkad App:\n'
                        'https://play.google.com/store/apps/details?id=com.'
                        'codemonks.nukkad');
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.share),
                  title: const Text('Refer Store to Customer',
                      style: TextStyle(fontSize: 17,)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) =>
                        ReferToCustomerScreen()));
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.question_mark_rounded),
                  title: const Text(
                      'Help and Support', style: TextStyle(fontSize: 17,)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    AppLinks.openUrl(AppLinks.helpAndSupport);
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.shield),
                  title: const Text(
                      'Privacy Policy', style: TextStyle(fontSize: 17,)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    AppLinks.openUrl(AppLinks.privacyPolicy);
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.file_copy_outlined),
                  title: const Text(
                      'Terms and Conditions', style: TextStyle(fontSize: 17,)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    AppLinks.openUrl(AppLinks.termsAndConditions);
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
                ListTile(
                  dense: true,
                  visualDensity: VisualDensity(vertical: -2),
                  contentPadding: EdgeInsets.symmetric(horizontal: 12),
                  leading: const Icon(Icons.star),
                  title: const Text(
                      'Rate Store', style: TextStyle(fontSize: 17,)),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 15,),
                  onTap: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (_) =>
                        RateStoreScreen()));
                  },
                ),
                const Divider(
                  color: Colors.black26,
                  thickness: 0.6,
                  height: 1,
                ),
     ] );
}