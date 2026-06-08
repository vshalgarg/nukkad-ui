import 'package:flutter/services.dart';
import '../db/local_storage.dart';
import '../common/logger.dart';
import '../models/store_model.dart';
import '../services/cart_services.dart';
import '../services/store_service.dart';
import 'customer_dashboard.dart';
import 'address_screen.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../services/address_service.dart';
import '../customer/order_placed_screen.dart';

class ShoppingCartScreen extends StatefulWidget {
  const ShoppingCartScreen({super.key,});

  @override
  State<ShoppingCartScreen> createState() => _ShoppingCartScreenState();
}

class _ShoppingCartScreenState extends State<ShoppingCartScreen> {
  bool isPlacingOrder = false;
  List<StoreModel> storeList = [];
  bool isDropdownOpen = false;
  int deliveryAddressId = 0;
  String addressName = "";
  String addressText = "";

  String storeName = "Select Store";
  String selectedStoreId = "";
  int? storeKeeperId;
  Map<int, TextEditingController> qtyController = {};

  @override
  void initState() {
    super.initState();
    loadStores();
    loadDefaultAddress();
  }

  Future<void> loadStores() async {
    final stores = await StoreService.getMyStores();
    if (stores.isEmpty) return;
    for (final store in stores) {
      log.i(
        "STORE: ${store.storeName} ID=${store.id}");
    }
    setState(() {
      storeList = stores;
      storeName = stores.first.storeName ?? "";
      selectedStoreId = stores.first.storeQrId ?? "";
      storeKeeperId = stores.first.id;
    });
    log.i("DEFAULT STORE ID: ${stores.first.id}");
    log.i("DEFAULT STOREKEEPER ID: $storeKeeperId");
  }

  Future<void> loadDefaultAddress() async {
    final addresses = await AddressService.getAddresses();
    final defaultAddress =
    addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first);

    setState(() {
      deliveryAddressId = defaultAddress.id;
      addressName = defaultAddress.name;
      addressText =
      "${defaultAddress.addressLine1}, ${defaultAddress.city}, ${defaultAddress
          .state}";
    });
  }
  @override
  Widget build(BuildContext context) {
    final cartProvider = context.watch<CartProvider>();
    final cartItems = cartProvider.cartItems;

    final size = MediaQuery
        .of(context)
        .size;
    final width = size.width;
    final height = size.height;

    return Scaffold(
      backgroundColor: Colors.white,
        appBar: AppBar(
          backgroundColor: Colors.white,
          title: Text(
            cartItems.isEmpty
                ? 'Shopping Cart'
                : 'Shopping Cart (${cartItems.length} items)',
          ),
          centerTitle: true,
        ),
        body: SafeArea(
            child: SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: EdgeInsets.all(width * 0.04),
                child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Select Store",
                      style: TextStyle(fontWeight: FontWeight.bold)),

                  SizedBox(height: height * 0.015),

                  GestureDetector(
                    onTap: () {
                      setState(() {
                        isDropdownOpen = !isDropdownOpen;
                      });
                    },
                    child: Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: width * 0.04,
                        vertical: height * 0.018,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.green, width: 2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              storeName,
                              overflow: TextOverflow.ellipsis,
                            ),
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
                                log.i("Tapped Store: ${store.storeName}");
                                log.i("Tapped Store ID: ${store.id}");

                                final storeQrId = await LocalStorageService.getStoreQrId();
                                final id = LocalStorageService.getStoreId();

                                await LocalStorageService.setStoreKeeperId(store.id ?? 0);

                               // log.i("SELECTED STORE KEEPER ID: $id");
                                log.i("SELECTED STORE: ${store.storeName}");
                                 log.i("SELECTED STORE ID: ${store.id}");
                                setState(() {
                                  storeName = store.storeName ?? "";
                                  selectedStoreId = store.storeQrId ?? "";
                                  storeKeeperId = store.id;
                                  isDropdownOpen = false;
                                });
                                log.i("FINAL STORE NAME: $storeName");
                                log.i("FINAL STOREKEEPER ID: $storeKeeperId");
                              },
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: width * 0.04,
                                  vertical: height * 0.015),
                              child: Text(
                                store.storeName ?? "",
                                style: TextStyle(fontSize: width * 0.04),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  SizedBox(height: height * 0.04),
                  const Text("Delivery Address",
                      style: TextStyle(fontWeight: FontWeight.bold)),

                  SizedBox(height: height * 0.015),

                  Container(
                    padding: EdgeInsets.all(width * 0.04),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.green, width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(addressName,
                                  style:
                                  const TextStyle(fontWeight: FontWeight.bold)),
                              SizedBox(height: height * 0.01),
                              Text(
                                addressText,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          ),
                          onPressed: () async {
                            final selectedAddress = await Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) =>
                                  AddressScreen()),
                            );

                            if (selectedAddress != null) {
                              setState(() {
                                deliveryAddressId = selectedAddress.id;
                                addressName = selectedAddress.name;
                                addressText =
                                "${selectedAddress
                                    .addressLine1}, ${selectedAddress.city}";
                              });
                            }
                          },
                          child: const Text("Change Address",
                            style: TextStyle(color: Colors.white),),
                        )
                      ],
                    ),
                  ),

                  SizedBox(height: height * 0.02),

                  Text(
                    "Selected Items (${cartItems.length})",
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),

                  SizedBox(height: height * 0.015),
        cartItems.isEmpty
            ? const Center(child: Text("Your cart is empty"))
            : ListView.builder(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          itemCount: cartItems.length,
                        itemBuilder: (context, index) {
                          final item = cartItems[index];
                          final controller = qtyController[item.itemId] ??=
                              TextEditingController(
                                text: item.quantity.toStringAsFixed(
                                  item.quantity % 1 == 0 ? 0 : 1,
                                ),
                              );
                          return Container(
                            margin: EdgeInsets.only(bottom: height * 0.015),
                            padding: EdgeInsets.all(width * 0.03),
                            decoration: BoxDecoration(
                              borderRadius:
                              BorderRadius.circular(width * 0.03),
                              border:
                              Border.all(color: Colors.grey.shade300),
                            ),
                            child: Row(
                              children: [
                                Image.network(
                                  item.image,
                                  height: width * 0.15,
                                  width: width * 0.15,
                                  fit: BoxFit.cover,
                                ),

                                SizedBox(width: width * 0.03),

                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                    CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.name,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: width * 0.035,
                                        ),
                                      ),
                                      SizedBox(height: height * 0.01),
                                      Row(
                                        children: [
                                          SizedBox(
                                            width: width * 0.18,
                                            height: 40,
                                            child: TextFormField(
                                              controller: controller,
                                              keyboardType: TextInputType.numberWithOptions(decimal: true),
                                              textAlign: TextAlign.center,
                                              inputFormatters: [
                                                LengthLimitingTextInputFormatter(4),
                                              ],
                                              decoration: InputDecoration(
                                                isDense: true,
                                                contentPadding: EdgeInsets.symmetric(vertical: 8),

                                                enabledBorder: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(10),
                                                  borderSide: BorderSide(color: Colors.grey.shade400),
                                                ),

                                                focusedBorder: OutlineInputBorder(
                                                  borderRadius: BorderRadius.circular(10),
                                                  borderSide: BorderSide(color: Colors.green),
                                                ),
                                              ),
                                              onChanged: (value) {
                                                if (value.isEmpty) return;
                                                if (value.replaceAll('.', '').length > 3) {
                                                  final controller = qtyController[item.id]!;
                                                  controller.selection = TextSelection.fromPosition(
                                                    TextPosition(offset: controller.text.length),
                                                  );
                                                  return;
                                                }
                                                if (value.endsWith('.')) return;
                                                if (value.contains('.') && value.split('.')[1].length > 1) return;

                                                final qty = double.tryParse(value);
                                                if (qty == null || qty <= 0 || qty >= 1000) return;

                                                context.read<CartProvider>().updateQuantity(item.itemId, qty);
                                              },
                                            ),
                                          ),

                                          SizedBox(width: width * 0.03),

                                          Expanded(
                                            child: PopupMenuButton<String>(
                                              color: Colors.white,
                                              position: PopupMenuPosition.under,

                                              onSelected: (value) {
                                                context.read<CartProvider>().updateUnit(item.itemId, value);
                                              },

                                              itemBuilder: (context) => item.units.map((u) {
                                                return PopupMenuItem(
                                                  value: u,
                                                  child: Text(u),
                                                );
                                              }).toList(),

                                              child: Container(
                                                height: 40,
                                                padding: const EdgeInsets.symmetric(horizontal: 12),
                                                decoration: BoxDecoration(
                                                  border: Border.all(color: Colors.grey.shade400),
                                                  borderRadius: BorderRadius.circular(10),
                                                  color: Colors.white,
                                                ),
                                                child: Row(
                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                  children: [
                                                    Text(item.unit),
                                                    const Icon(Icons.keyboard_arrow_down),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),

                                IconButton(
                                  icon: const Icon(Icons.delete,
                                      color: Colors.red),
                                  onPressed: () {
                                    context
                                        .read<CartProvider>()
                                        .removeItemById(item.itemId);
                                  },
                                )
                              ],
                            ),
                                ])
                                )
                          ]));
                        },
                      ),
                  SizedBox(height: 20,)
           ]))),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(width * 0.04),
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => CustomerDashboard()),
                    );
                  },
                  child: const Text("Add more items",
                    style:TextStyle(
                        color: Colors.white),
                ),
              ),),
              SizedBox(width: width * 0.03),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green),
                    onPressed: () async {
                      log.i("STORE KEEPER ID: $storeKeeperId");
                      if (storeKeeperId == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Please select a store")),
                        );
                        return;
                      }
                      final backendCart = await CartService().getCartItems();
                      log.i("BACKEND CART COUNT: ${backendCart.length}");
                      if (backendCart.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Cart is empty")),
                        );
                        return;
                      }
                      log.i("STORE NAME: $storeName");
                      log.i("STOREKEEPER ID: $storeKeeperId");
                      log.i("ADDRESS ID: $deliveryAddressId");
                      final success = await CartService().placeOrder(
                        deliveryAddressId: deliveryAddressId,
                        storeKeeperId: storeKeeperId!,
                        cartItems:  backendCart,
                      );

                      if (success) {
                        context.read<CartProvider>().clearCart();

                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const OrderPlacedScreen(),
                          ),
                        );
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Order failed")),
                        );
                      }
                    },
                  child: const Text("Proceed",
                  style:TextStyle(
                    color: Colors.white
                  )),
                ),
              ),
            ],
          ),
        ),
      ));
  }
}