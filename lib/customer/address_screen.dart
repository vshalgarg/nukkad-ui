import 'package:codemonks_nukkad/customer/customer_dashboard.dart';
import 'package:flutter/material.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../models/address_model.dart';
import '../services/address_service.dart';
import 'add_address_screen.dart';
import 'edit_address_screen.dart';

class AddressScreen extends StatefulWidget {
  const AddressScreen({super.key});

  @override
  State<AddressScreen> createState() => _AddressScreenState();
}

class _AddressScreenState extends State<AddressScreen> {
  List<AddressModel> addresses = [];
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadAddresses();
  }

  Future<void> loadAddresses() async {
    log.d("Loading addresses...");
    try {
      final token = LocalStorageService.getToken();
      if (token == null) {
        log.e("Token is null");
        return;
      }
      log.i("Token found");
      final data = await AddressService.getAddresses();
      log.d("API Response: ${data.length} addresses");
      setState(() {
        addresses = data;
        isLoading = false;
      });

    } catch (e) {
      log.e("ADDRESS LOAD ERROR: $e");
      setState(() {
        isLoading = false;
      });
    }
  }

  void markDefault(int index) {
    setState(() {

      for (var a in addresses) {
        a.isDefault = false;
      }

      addresses[index].isDefault = true;

    });

  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final width = size.width;
    final height = size.height;
    return Scaffold(
        appBar: AppBar(
            title: Text("Delivery Address",
              style: TextStyle(fontSize: width * 0.05),),
            leading: IconButton(onPressed: (){
              Navigator.push(context, MaterialPageRoute(builder: (_)=>
                  CustomerDashboard()));
            },
              icon: Icon(Icons.arrow_back, size: width * 0.06),
            )
        ),
        body: isLoading
            ? const Center(child: CircularProgressIndicator())
            : addresses.isEmpty
            ?  Center(child: Text("No address found",
          style: TextStyle(fontSize: width * 0.045),))
            : ListView.builder(
          padding: EdgeInsets.all(width * 0.04),
          itemCount: addresses.length,
          itemBuilder: (context, index) {
            final address = addresses[index];

            return InkWell(
                onTap: () {
                  Navigator.pop(context, address);
                },
                child: Container(
                  margin: EdgeInsets.only(bottom: height * 0.015),
                  padding: EdgeInsets.all(width * 0.04),
                  decoration: BoxDecoration(
                    color: address.isDefault
                        ? Colors.green.withOpacity(0.05)
                        : Colors.white,
                    border: Border.all(
                      color: address.isDefault ? Colors.green : Colors.grey.shade300,
                      width: 2,
                    ),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              address.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: width * 0.045,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),

                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: Icon(
                                Icons.edit, color: Colors.green,
                                size: width * 0.055),
                            onPressed: () async {
                              final updatedAddress =
                              await Navigator.push<AddressModel>(
                                context,
                                MaterialPageRoute(
                                  builder: (_) =>
                                      EditAddressScreen(address: address),
                                ),
                              );

                              if (updatedAddress != null) {
                                setState(() {
                                  addresses[index] = updatedAddress;
                                });
                              }
                            },
                          ),

                          SizedBox(width: width * 0.008),
                          if (!address.isDefault)
                            IconButton(
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              icon: Icon(
                                  Icons.delete, color: Colors.red,
                                  size: width * 0.055),
                              onPressed: () async {
                                final confirm = await showDialog(
                                  context: context,
                                  builder: (_) =>
                                      AlertDialog(
                                        title: const Text("Delete Address"),
                                        content: const Text(
                                            "Are you sure you want to delete this address?"),
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
                                  log.w("Deleting address ID: ${address.id}");
                                  final success =
                                  await AddressService.deleteAddress(address.id);

                                  if (success) {
                                    log.i("Address deleted successfully");
                                    setState(() {
                                      addresses.removeAt(index);
                                    });
                                  } else {
                                    log.e("Delete failed ❌");
                                  }
                                }
                              },
                            ),
                        ],
                      ),

                      SizedBox(height: height * 0.01),

                      Text(
                        "${address.addressLine1}, ${address.landmark}, ${address.city}, ${address.state} - ${address.pincode}",
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: Colors.grey, fontSize: width * 0.038,
                        height:1.4),
                      ),
                      SizedBox(height: height * 0.01),

                      if (!address.isDefault)
                        Align(
                          alignment: Alignment.centerRight,
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              padding: EdgeInsets.symmetric(
                                horizontal: width * 0.04,
                                vertical: height * 0.012,
                              ),
                            ),
                            onPressed: () async {
                              log.d("Marking default address ID: ${address.id}");
                              final success =
                              await AddressService.markDefaultAddress(address.id);

                              if (success) {
                                log.i("Default address updated ");
                                setState(() {
                                  for (var a in addresses) {
                                    a.isDefault = false;
                                  }

                                  addresses[index].isDefault = true;
                                });
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                      content: Text(
                                          "Failed to update default address")),
                                );
                              }
                            },
                            child: Text("Mark as Default",
                              style:
                              TextStyle(fontSize: width * 0.035,
                              color: Colors.black),
                            ),
                          ),
                        ),
                    ],
                  ),
                )
            );
          },
        ),
        bottomNavigationBar:SafeArea(
            child: Padding(
                padding: EdgeInsets.all(width * 0.04),
                child: SizedBox(
                  height: height * 0.065,
                  child:
                  ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      icon: Icon(Icons.add, size: width * 0.05,color: Colors.white,),
                      label: const Text("Add Address",
                          style: TextStyle(
                              color: Colors.white)),
                      onPressed: () async {
                        final result = await Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (_) => const AddAddressScreen()),
                        );

                        if (result == true) {
                          loadAddresses();
                        }
                      }),

                )
            )));
  }
}
