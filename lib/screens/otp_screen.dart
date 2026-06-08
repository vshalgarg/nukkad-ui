import 'package:flutter/material.dart';
class OtpScreen extends StatelessWidget {
  final TextEditingController controller;

   const OtpScreen({super.key,
required this.controller,
     required  Function onChanged
    });

  @override
  Widget build(BuildContext context) {
  return TextField(
      controller: controller,
          keyboardType:TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          decoration: InputDecoration(
            hintText: 'Enter OTP',
            counterText: '',
            border:OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
              borderSide: BorderSide(width: 10),
            ),
          ),
  );
  }
}