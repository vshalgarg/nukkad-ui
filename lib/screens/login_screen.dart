import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:codemonks_nukkad/utils/validators.dart';
import 'package:codemonks_nukkad/customer/customer_dashboard.dart';
import 'package:codemonks_nukkad/customer/customer_create_profile.dart';
import 'package:codemonks_nukkad/shopkeeper/shopkeeper_dashboard.dart';
import 'package:codemonks_nukkad/shopkeeper/shopkeeper_create_profile.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../services/auth_service.dart';
import 'otp_screen.dart';
import 'phone_text_field.dart';
import 'package:firebase_auth/firebase_auth.dart';

class LoginScreen extends StatefulWidget {
  final String role;
  const LoginScreen({super.key, required this.role});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  late String selectedRole;

  final TextEditingController phoneController = TextEditingController();
  final TextEditingController otpController = TextEditingController();

  bool isLoading = false;
  bool isOtpScreen = false;
  String? verificationId;

  @override
  void initState() {
    super.initState();
    selectedRole = widget.role;
    FirebaseMessaging.instance.requestPermission();
  }

  //  SEND OTP
  Future<void> sendOtp() async {
    log.i("SEND OTP clicked: ${phoneController.text}");

    if (!Validators.isValidPhone(phoneController.text.trim())) {
      log.w("Invalid phone number");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter valid phone number")),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      // CALL BACKEND
      log.d("Calling AuthService.sendOtp");
      final success = await AuthService.sendOtp(phoneController.text.trim());
      log.d("sendOtp response: $success");
      if (!success) {
        log.e("Backend OTP failed");
        setState(() => isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Backend failed. Try again.")),
        );
        return;
      }

      // FIREBASE OTP
      log.i("Backend OTP success, starting Firebase verification");
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: "+91${phoneController.text.trim()}",
        verificationCompleted: (credential) async {
          log.i("Firebase auto verification completed");
        },
        verificationFailed: (FirebaseAuthException ex) {
          log.e("Firebase verification failed",
              error: ex.message);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(ex.message ?? "Verification failed")),
          );
        },
        codeSent: (String verId, int? resendToken) {
          log.i("OTP sent successfully");
          log.d("verificationId: $verId");
          setState(() {
            verificationId = verId;
            isOtpScreen = true;
          });
        },
        codeAutoRetrievalTimeout: (String verId) {
          log.i("OTP sent successfully");
          log.d("verificationId: $verId");
          verificationId = verId;
        },
        timeout: const Duration(seconds: 60),
      );
    } catch (e) {
      log.e("Send OTP ERROR: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );
    }

    setState(() => isLoading = false);
  }

  //  VERIFY OTP
  Future<void> verifyOtp() async {
    log.i("Verifying OTP: ${otpController.text}");
    if (otpController.text.length != 6) {
      log.w("Invalid OTP length");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter 6 digit OTP")),
      );
      return;
    }

    setState(() => isLoading = true);

    try {
      //  Firebase credential
      log.d("Creating Firebase credential");
      PhoneAuthCredential credential = PhoneAuthProvider.credential(
        verificationId: verificationId!,
        smsCode: otpController.text.trim(),
      );

      //  Firebase login
      log.d("Signing in with Firebase");

      UserCredential userCredential =
      await FirebaseAuth.instance.signInWithCredential(credential);

      final user = userCredential.user;

      if (user != null) {
        // Get fresh Firebase token
        log.i("Firebase login success");
        final String firebaseToken = (await user.getIdToken(true))!;
        log.d("Firebase token: $firebaseToken");

        String? deviceToken =
        await FirebaseMessaging.instance.getToken();
        log.d("Device token: $deviceToken");
        log.d("Calling AuthService.verifyLogin");
        // CALL BACKEND VERIFY LOGIN
        final response = await AuthService.verifyLogin(
          mobile: phoneController.text.trim(),
          firebaseToken: firebaseToken,
          deviceToken: deviceToken,
        );
        print("FULL RESPONSE => $response");
        print("NAME => ${response['name']}");
        print("STORE NAME => ${response['storeName']}");
        log.d("Backend response: $response");
        await LocalStorageService.setName(
          response['name'] ?? '',
        );

        await LocalStorageService.setStoreName(
          response['storeName'] ?? '',
        );
        final prefs = await SharedPreferences.getInstance();

        await prefs.setString(
          'shopkeeper_name',
          response['name'] ?? '',
        );

        await prefs.setString(
          'shopkeeper_store_name',
          response['storeName'] ?? '',
        );

        print(
          "LOGIN SAVED NAME => ${prefs.getString('shopkeeper_name')}",
        );

        print(
          "LOGIN SAVED SHOP => ${prefs.getString('shopkeeper_store_name')}",
        );
        //  Extract response
        int firstTimeLogin = response['firstTimeLogin'];
        int userId = response['userId'];
        String backendToken = response['token'];

        //  SAVE SESSION (IMPORTANT)

        log.d("Saving session");
        await LocalStorageService.setToken(backendToken);
        await LocalStorageService.setUserId(userId);
        await LocalStorageService.setLoggedIn(true);
        await LocalStorageService.setRole(selectedRole);
        log.i("Session saved successfully");

        // NAVIGATION
        if (firstTimeLogin == 1501) {
          log.i("Navigating to profile creation");
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => selectedRole == "customer"
                  ? CustomerForm(userId: userId)
                  : ShopkeeperForm(userId: userId),
            ),
          );
        } else {
          log.i("Navigating to dashboard");
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => selectedRole == "customer"
                  ? const CustomerDashboard()
                  : const ShopkeeperDashboard(),
            ),
          );
        }
      }else{
        log.e("Firebase user is null");
      }
    } catch (e) {
      log.e("Error: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Invalid OTP")),
      );
    }

    setState(() => isLoading = false);
  }
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final height = size.height;
    final width = size.width;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: width * 0.05,
            vertical: height * 0.02,
          ),
          child: Column(
            children: [
              SizedBox(height: height * 0.05),

              Image.asset(
                'assets/images/grocery.png',
                height: height * 0.15,
              ),

              SizedBox(height: height * 0.02),

              Text(
                "Login",
                style: TextStyle(
                  fontSize: width * 0.07,
                  fontWeight: FontWeight.bold,
                ),
              ),

              SizedBox(height: height * 0.04),

              PhoneTextField(
                controller: phoneController,
                onChanged: (_) => setState(() {}),
                enabled: !isOtpScreen,
              ),

              SizedBox(height: height * 0.04),

              if (!isOtpScreen)
                SizedBox(
                  width: double.infinity,
                  height: height * 0.065,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : sendOtp,
                    child: isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                      "Send OTP",
                      style: TextStyle(fontSize: width * 0.04),
                    ),
                  ),
                ),

              if (isOtpScreen) ...[
                SizedBox(height: height * 0.02),

                Text(
                  "Enter 6 digit code",
                  style: TextStyle(fontSize: width * 0.04),
                ),

                SizedBox(height: height * 0.02),

                OtpScreen(
                  controller: otpController,
                  onChanged: (_) => setState(() {}),
                ),

                SizedBox(height: height * 0.04),

                SizedBox(
                  width: double.infinity,
                  height: height * 0.065,
                  child: ElevatedButton(
                    onPressed:
                    (isLoading || !isOtpScreen) ? null : verifyOtp,
                    child: isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                      "Verify OTP",
                      style: TextStyle(fontSize: width * 0.04),
                    ),
                  ),
                ),

                SizedBox(height: height * 0.02),

                GestureDetector(
                  onTap: isLoading ? null : sendOtp,
                  child: Text(
                    "Resend OTP",
                    style: TextStyle(
                      fontSize: width * 0.04,
                      color: Colors.blue,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
              ],

              SizedBox(height: height * 0.05),

              Text(
                "I agree to Terms & Conditions\nPrivacy Policy",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: width * 0.035,
                  decoration: TextDecoration.underline,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}