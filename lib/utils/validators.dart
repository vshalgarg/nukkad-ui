import 'package:flutter/material.dart';

class Validators {
  static bool isValidPhone(String phone){
    return true;
  }

  static bool validateMobile(BuildContext context, String value) {
    if (value.isEmpty) {
      _showSnackBar(context, "Mobile number is required");
      return false;
    }

    if (value.length != 10) {
      _showSnackBar(context, "Enter valid 10-digit mobile number");
      return false;
    }
    return true;
  }
  static bool validateOtp(BuildContext context, String value) {
    if (value.isEmpty) {
      _showSnackBar(context, "OTP is required");
      return false;
    }

    if (value.length != 4) {
      _showSnackBar(context, "Enter valid 4-digit OTP");
      return false;
    }
    return true;
  }
  static void _showSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}






























































































































