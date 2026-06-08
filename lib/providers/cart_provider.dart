import 'package:flutter/material.dart';
import '../models/cart_item_model.dart';
import '../services/cart_services.dart';
import '../common/logger.dart';
class CartProvider with ChangeNotifier {
   List<CartItemModel> _cartItems = [];

  List<CartItemModel> get cartItems => _cartItems;

  int get itemCount => _cartItems.length;

  String _selectedStore = "Selected Store";

  String get selectedStore => _selectedStore;
  bool isInCart(int productId) {
    return _cartItems.any((item) => item.itemId == productId);
  }
  CartItemModel? getItem(int productId) {
    try {
      return _cartItems.firstWhere((p) => p.itemId == productId);
    } catch (e) {
      return null;
    }
  }
  void addToCart(CartItemModel item) {
    final index =
    _cartItems.indexWhere((p) => p.itemId == item.itemId);

    if (index != -1) {
      _cartItems[index].quantity = item.quantity;
    } else {
      _cartItems.add(item);
    }

    notifyListeners();
  }
  Future<void> updateCart() async {
    try {
      final data = await CartService().getCartItems();
      log.d("API CART DATA: $data");
      _cartItems = data;
      log.i("Provider cart count: ${_cartItems.length}");
      notifyListeners();
    } catch (e) {
      log.i("Cart update error: $e");
    }
  }
  void updateQuantity(int productId, double qty) {
    final index =
    _cartItems.indexWhere((p) => p.itemId == productId);

    if (index != -1) {
      if (qty <= 0) {
        _cartItems.removeAt(index);
      } else {
        _cartItems[index].quantity = qty;
      }
      notifyListeners();
    }
  }
  void removeItemById(int productId) {
    _cartItems.removeWhere((p) => p.itemId == productId);
    notifyListeners();
  }
  void updateUnit(int itemId, String unit) {
    final index = _cartItems.indexWhere((item) => item.itemId == itemId);
    if (index != -1) {
      _cartItems[index].unit = unit;
      notifyListeners();
    }
  }
  void setSelectedStore(String store) {
    _selectedStore = store;
    notifyListeners();
  }
  void clearCart() {
    _cartItems.clear();
    notifyListeners();
  }

  double getQty(int productId) {
    final item = getItem(productId);
    return item?.quantity ?? 0;
  }
}