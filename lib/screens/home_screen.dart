
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../common/logger.dart';
import '../main.dart';
import 'login_screen.dart';
import 'notification_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
  FlutterLocalNotificationsPlugin();

  @override
  void initState() {
    super.initState();
    initNotifications();
  }

  Future<void> initNotifications() async {
    //  Permission
    NotificationSettings settings =
    await FirebaseMessaging.instance.requestPermission();
    log.d("Permission: ${settings.authorizationStatus}");

    //  Device Token
    String? token = await FirebaseMessaging.instance.getToken();
    log.i("DEVICE TOKEN: $token");

    //  Notification Channel
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'High Importance Notifications',
      description: 'Used for important notifications',
      importance: Importance.max,
    );

    final androidPlugin = flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();

    await androidPlugin?.createNotificationChannel(channel);

    //  Init settings
    const AndroidInitializationSettings androidSettings =
    AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initSettings =
    InitializationSettings(android: androidSettings);
    await flutterLocalNotificationsPlugin.initialize(
     settings:  initSettings,
      onDidReceiveNotificationResponse: (response) {
        final payload = response.payload ?? "";

        navigatorKey.currentState?.push(
          MaterialPageRoute(
            builder: (_) => NotificationDetailScreen(message: payload),
          ),
        );
      },
    );

    //  FOREGROUND MESSAGE
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      log.i("DATA: ${message.data}");

      String body = message.data['body'] ??
          message.notification?.body ??
          "New update received";

      showNotification(body, body);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      log.i("Notification clicked (background)");

      String body = message.data['body'] ??
          message.notification?.body ??
          "New update received";

      navigatorKey.currentState?.push(
        MaterialPageRoute(
          builder: (_) => NotificationDetailScreen(message: body),
        ),
      );
    });
  }

  // Show notification
  Future<void> showNotification(String body, String payload) async {
    const AndroidNotificationDetails androidDetails =
    AndroidNotificationDetails(
      'high_importance_channel',
      'High Importance Notifications',
      channelDescription: 'Used for important notifications',
      importance: Importance.max,
      priority: Priority.high,
    );

    const NotificationDetails notificationDetails =
    NotificationDetails(android: androidDetails);

    await flutterLocalNotificationsPlugin.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title: " ",
      body: body,
      notificationDetails: notificationDetails,
      payload: payload, //
    );
  }

  void _handleUserSelection(String userType) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => LoginScreen(role: userType),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
      ),

      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [

              Image.asset(
                'assets/images/grocery.png',
                height: 200,
              ),

              const SizedBox(height: 10),

              const Text(
                'Select User Type',
                style: TextStyle(
                  fontSize: 25,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => _handleUserSelection("customer"),
                  child: const Text(
                    'I AM CUSTOMER',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),

              const SizedBox(height: 15),

              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () => _handleUserSelection("shopkeeper"),
                  child: const Text(
                    'I AM SHOPKEEPER',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}