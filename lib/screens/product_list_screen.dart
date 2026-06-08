import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/cart_item_model.dart';
import '../models/item_model.dart';
import '../providers/cart_provider.dart';
import '../customer/shopping_cart_screen.dart';
import '../services/cart_services.dart';
import '../services/item_service.dart' as ItemService;
import '../common/common_app_bar.dart';
import '../common/common_search_bar.dart';
import '../services/store_storage.dart';

class ProductListScreen extends StatefulWidget {
  final String? searchKeyword;
  final String categoryTitle;
  final int categoryId;

  const ProductListScreen({
    super.key,
    this.searchKeyword,
    required this.categoryId,
    required this.categoryTitle,
  });

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  Map<int, bool> qtyErrorMap = {};
  String storeName = "Select Store";
  List<ItemModel> items = [];
  bool isLoading = true;

  Map<int, int> itemQuantityMap = {};
  Map<int, String> selectedUnitMap = {};
  Map<int, TextEditingController> qtyController = {};

  @override
  void initState() {
    super.initState();
    loadStore();
    widget.searchKeyword != null && widget.searchKeyword!.isNotEmpty
        ? searchItems(widget.searchKeyword!)
        : loadItems();
  }

  Future<void> loadStore() async {
    final savedStores = await StoreStorage.getStores();
    if (savedStores.isNotEmpty) {
      setState(() {
        storeName = savedStores.first;
      });
    }
  }

  Future<void> loadItems() async {
    try {
      final data =
      await ItemService.ItemService.getItemsByCategory(widget.categoryId);

      setState(() {
        items = data;

        for (var item in data) {
          itemQuantityMap[item.id] = 0;
          selectedUnitMap[item.id] =
          item.unit.isNotEmpty ? item.unit.first : "";
          qtyController[item.id] = TextEditingController();
        }

        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> searchItems(String keyword) async {
    setState(() => isLoading = true);

    try {
      final results = await ItemService.ItemService.searchItems(keyword);

      setState(() {
        items = results;
        itemQuantityMap.clear();
        selectedUnitMap.clear();
        qtyController.clear();

        for (var item in results) {
          itemQuantityMap[item.id] = 0;
          selectedUnitMap[item.id] =
          item.unit.isNotEmpty ? item.unit.first : "";
          qtyController[item.id] = TextEditingController();
        }

        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  @override
  void dispose() {
    for (var controller in qtyController.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: CommonAppBar(
        title: storeName,
        onCartTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const ShoppingCartScreen(),
            ),
          );
        },
      ),
      body: Column(
        children: [
          CommonSearchBar(
            onSearch: (value) {
              value.trim().isEmpty ? loadItems() : searchItems(value);
            },
          ),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : items.isEmpty
                ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.search_off, size: 60, color: Colors.grey),
                  SizedBox(height: 10),
                  Text(
                    "No products found",
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            )
                : GridView.builder(
    padding: EdgeInsets.all(width * 0.02),
              itemCount: items.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.55,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
              ),
              itemBuilder: (context, index) {
                return _productCard(items[index]);
              },
            ),
          )
        ],
      ),
      bottomNavigationBar: _bottomCartBar(),
    );
  }

  Widget _productCard(ItemModel item) {
    final cartProvider = context.watch<CartProvider>();
    final cartItem = cartProvider.getItem(item.id);

    final controller = qtyController[item.id];

    if (cartItem != null && controller != null) {
      final displayQty = cartItem.quantity.toStringAsFixed(
        cartItem.quantity % 1 == 0 ? 0 : 1,
      );
      if (controller.text != displayQty) {
        controller.value = TextEditingValue(
          text: displayQty,
          selection: TextSelection.collapsed(offset: displayQty.length),
        );
      }
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.white,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(10),
              child: item.imageUrls.isNotEmpty &&
                  item.imageUrls.first.isNotEmpty
                  ? Image.network(
                item.imageUrls.first,
                fit: BoxFit.contain,
                width: double.infinity,
                errorBuilder: (_, __, ___) =>
                 Icon(Icons.broken_image,),
              )
                  : Container(
                color: Colors.grey.shade200,
                child: const Center(
                  child: Icon(Icons.image, size: 30),
                ),
              ),
            ),
          ),

          const SizedBox(height: 4),
          Text(
            item.name,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 40,
                    child: TextField(
                      controller: qtyController[item.id],
                      keyboardType: TextInputType.numberWithOptions(decimal: true),
                      textAlign: TextAlign.center,
                      textAlignVertical: TextAlignVertical.center,
                      inputFormatters: [
                        LengthLimitingTextInputFormatter(4),
                      ],
                      decoration: InputDecoration(
                        hintText: "Qty",
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: (qtyErrorMap[item.id] ?? false)
                                ? Colors.red
                                : Colors.grey,
                          ),
                        ),

                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide(
                            color: qtyErrorMap[item.id] == true
                                ? Colors.red
                                : Colors.green,
                            width: 2,
                          ),
                        ),
                      ),
                        onChanged: (value) {
                          if (value.isEmpty) return;
                          if (value.replaceAll('.', '').length > 3) {
                            final controller = qtyController[item.id]!;
                            controller.text = value.substring(0, 3);
                            controller.selection = TextSelection.fromPosition(
                              TextPosition(offset: controller.text.length),
                            );
                            return;
                          }
                          if (value.replaceAll('.', '').length > 3) {
                            final controller = qtyController[item.id]!;
                            controller.text = value.substring(0, 3);
                            controller.selection = TextSelection.fromPosition(
                              TextPosition(offset: controller.text.length),
                            );
                            return;
                          }

                          final qty = double.tryParse(value);
                          if (qty == null || qty >= 1000) return;
                          if (value.contains('.') && value.split('.')[1].length > 1) return;
                          itemQuantityMap[item.id] = qty.toInt();
                          final cartProvider = context.read<CartProvider>();
                          if (cartProvider.isInCart(item.id)) {
                            cartProvider.updateQuantity(item.id, qty);
                          }
                        },
                    ),
                  ),
                ),

                const SizedBox(width: 6),

                Expanded(
                  child: SizedBox(
                    height: 40,
                    child: PopupMenuButton<String>(
                      color: Colors.white,
                      onSelected: (value) {
                        setState(() {
                          selectedUnitMap[item.id] = value;
                        });
                      },
                      position: PopupMenuPosition.under,
                      itemBuilder: (context) => item.unit.map((u) {
                        return PopupMenuItem(
                          value: u,
                          child: Text(u),
                        );
                      }).toList(),
                      child: Container(
                        height: 40,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        decoration: BoxDecoration(
                          border: Border.all(color: Colors.grey),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(selectedUnitMap[item.id] ?? ""),
                            const Icon(Icons.keyboard_arrow_down),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            Align(
              alignment: Alignment.centerRight,
              child: SizedBox(
                height: 40,
              child: cartItem != null
                  ? _addedButton()
                  : _addButton(item),
            )
            )],
        ),
    );
  }

  Widget _addButton(ItemModel item) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        side: const BorderSide(color: Colors.black),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(25),
        ),
      ),
        onPressed: () async {
          final qty = itemQuantityMap[item.id] ?? 0;
          final unit = selectedUnitMap[item.id];

          if (qty <= 0) {
            setState(() {
              qtyErrorMap[item.id] = true;
            });
            return;
          }

          if (unit == null || unit.isEmpty) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Please select unit")),
            );
            return;
          }

          setState(() {
            qtyErrorMap[item.id] = false;
          });

          final success = await CartService.addToCart(
            itemId: item.id,
            quantity: qty.toInt(),
            unit: unit,
          );

          if (success) {
            context.read<CartProvider>().addToCart(
              CartItemModel(
                id: item.id,
                itemId: item.id,
                name: item.name,
                image: item.imageUrls.isNotEmpty
                    ? item.imageUrls.first
                    : "",
                quantity: qty.toDouble(),
                unit: unit,
                units: item.unit,
              ),
            );
          }
        },
      child: const Text("Add to Cart"),
    );
  }
  Widget _addedButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.green.shade50,
        border: Border.all(color: Colors.green),
      ),
      child: Text(
        "Added",
        style: const TextStyle(
            color: Colors.green, fontWeight: FontWeight.w600),
      ),
    );
  }

  Widget _bottomCartBar() {
    final width = MediaQuery.of(context).size.width;
    return Consumer<CartProvider>(
      builder: (context, cart, _) {
        if (cart.itemCount == 0) return const SizedBox();

        return SafeArea(
          child: Container(
            margin: EdgeInsets.all(width * 0.04),
            padding: EdgeInsets.symmetric(
              horizontal: width * 0.04,
              vertical: width * 0.03,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(color: Colors.green, width: 2),
              borderRadius: BorderRadius.circular(40),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.08),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    "${cart.itemCount} items in cart",
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                // RIGHT BUTTON
                ElevatedButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const ShoppingCartScreen(),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  ),
                  child: const Text(
                    "Go to Cart",
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}