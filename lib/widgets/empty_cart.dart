import 'package:flutter/material.dart';

class EmptyCart extends StatelessWidget {
  const EmptyCart({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children:[
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          const Text(
            'Your cart is empty',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),),
          Icon(Icons.shopping_cart_outlined),
          const SizedBox(height: 20),
      ],
    ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  shape: const StadiumBorder(),
                ),
                onPressed: () {
                  Navigator.pop(context);
                },
                 child:const Text('Browse Grocery',
                 style: TextStyle(color: Colors.white),),
                ),
            ],
          ),

    );
  }
}
