import 'package:codemonks_nukkad/screens/home_screen.dart';
import 'package:flutter/material.dart';
import '../common/logger.dart';
import '../customer/customer_dashboard.dart';
import '../db/local_storage.dart';
import '../shopkeeper/shopkeeper_dashboard.dart';


class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () {
      checkLoginStatus();
    });
  }
     Future<void> checkLoginStatus() async {
    //await LocalStorageService.clear();
       final token = LocalStorageService.getToken();
       final isLoggedIn = LocalStorageService.isLoggedIn();
       final profileCompleted = LocalStorageService
           .getProfileCompleted() ;
       final role = LocalStorageService.getRole();
       log.i("isLoggedIn: $isLoggedIn");
       log.i("profileCompleted: $profileCompleted");
       log.d("token: $token");
       log.d("role: $role");
        if (profileCompleted&&isLoggedIn) {
          if (role == "customer") {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => const CustomerDashboard(),
              ),
            );
          } else {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (_) => const ShopkeeperDashboard(),
              ),
            );
          }
        } else {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => const HomeScreen(),
            ),
          );
        }
   }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Center(
        child: Image.asset("assets/images/splash_.png"),
      ),
    );
  }
}