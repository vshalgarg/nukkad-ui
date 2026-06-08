import 'package:codemonks_nukkad/customer/shopping_cart_screen.dart';
import '../providers/cart_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class CommonAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final VoidCallback? onCartTap;


  const CommonAppBar({
    super.key,
    required this.title,
    this.onCartTap,

  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      leading: const BackButton(color: Colors.black),
    title: Row(
        children: [
          const Icon(Icons.store, color: Colors.black),
          const SizedBox(width: 6),
          Text(
            title,
            style: const TextStyle(
              color: Colors.black,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      actions: [
          Consumer<CartProvider>(
            builder:(context,cartProvider,_)
    {
      return Stack(
        children: [
          IconButton(
            icon: const Icon(Icons.shopping_cart, color: Colors.black),
            onPressed: (){
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_)=>
              ShoppingCartScreen()));
            },
          ),
          if (cartProvider.itemCount > 0)
            Positioned(
              right: 6,
              top: 6,
              child: CircleAvatar(
                radius: 9,
                backgroundColor: Colors.red,
                child: Text(
                  cartProvider.itemCount.toString(),
                  style: const TextStyle(fontSize: 12, color: Colors.white),
                ),
              ),
            ),
        ],
      );
    }
          )
      ],
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
