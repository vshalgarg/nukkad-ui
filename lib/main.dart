import 'package:codemonks_nukkad/providers/cart_provider.dart';
import 'package:codemonks_nukkad/providers/order_provider.dart';
import 'package:codemonks_nukkad/screens/splash_screen.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:codemonks_nukkad/db/local_storage.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'common/logger.dart';
import 'providers/shopkeeper_order_provider.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
FlutterLocalNotificationsPlugin();
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  FirebaseAuth.instance.setSettings(
    appVerificationDisabledForTesting: true,
  );
  await dotenv.load(fileName: ".env");
  await LocalStorageService.init();
  runApp(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => CartProvider()),
          ChangeNotifierProvider(create: (_) => OrderProvider()),
          ChangeNotifierProvider(create: (_) => ShopkeeperOrderProvider()),
        ],
        child: const MyApp(),));
}
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  log.i("Background message: ${message.notification?.title}");
}
class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      home: SplashScreen(),
    );
  }
}