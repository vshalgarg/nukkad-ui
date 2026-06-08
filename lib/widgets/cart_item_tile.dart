import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../models/product_model.dart';

class CartItemTile extends StatelessWidget {
  final Product product;
  const CartItemTile({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartProvider>();

    return Card(
      margin: const EdgeInsets.all(12),
      child: ListTile(
        leading: Image.asset(product.image, width: 60),
        title: Text(product.name),
        trailing: IconButton(
          icon: const Icon(Icons.delete),
          onPressed: () {
            cart.removeItemById(product.id);
          },
        ),
      ),
    );
  }
}
