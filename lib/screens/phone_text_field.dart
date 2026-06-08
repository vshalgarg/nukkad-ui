import 'package:flutter/material.dart';

class PhoneTextField extends StatelessWidget{
  final TextEditingController controller;
  final bool readOnly;
  final ValueChanged<String>? onChanged;
   const PhoneTextField({super.key,
     this.onChanged,
  required this.controller,
     this.readOnly = false, required bool enabled,});
 @override
  Widget build(BuildContext context) {
  return TextField(
      controller:controller,
      readOnly: readOnly,
      keyboardType:TextInputType.phone,
      maxLength: 10,
      onChanged: onChanged,
      decoration:InputDecoration(
        counterText: '',
        hintText:"Enter Mobile Number",
        filled: readOnly,
        fillColor: readOnly? Colors.grey.shade200:null,
        prefixIcon: SizedBox(
          width: 80,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                "assets/images/india_flag.png",
                width: 20,
                errorBuilder: (_, __, ___) =>
                const Icon(Icons.flag, size: 20),
              ),
              const SizedBox(width: 4),
              const Text("+91"),
            ],
          ),
        ),

   border: OutlineInputBorder(
   borderRadius: BorderRadius.circular(30),
   ),
   ),
  );

  }

  }