import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/qr_model.dart';

class LocalStorageService {
  static late SharedPreferences _prefs;

  static String? _userName;
  static String? _phone;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  static void setUserName(String name) {
    _userName = name;
  }

  static String? getUserName() {
    return _userName;
  }

  static void setPhone(String phone) {
    _phone = phone;
  }

  static String? getPhone() {
    return _phone;
  }

  static Future<void> setToken(String token) async {
    await _prefs.setString("token", token);
  }

  static String? getToken() {
    return _prefs.getString("token");
  }

  static Future<void> setLoggedIn(bool value) async {
    await _prefs.setBool("isLoggedIn", value);
  }

  static bool isLoggedIn() {
    return _prefs.getBool("isLoggedIn") ?? false;
  }

  static Future<void> setRole(String role) async {
    await _prefs.setString("role", role);
  }

  static String getRole() {
    return _prefs.getString("role") ?? "";
  }

  static Future<void> setUserId(int id) async {
    await _prefs.setInt("userId", id);
  }

  static int getUserId() {
    return _prefs.getInt("userId") ?? 0;
  }

  static Future<void> clear() async {
    await _prefs.clear();
  }

  static Future<void> setOtp(String value) async {
    await _prefs.setString("otp", value);
  }

  static String? getOtp() {
    return _prefs.getString("otp");
  }

  static Future<void> setProfileCompleted(bool value) async {
    await _prefs.setBool("profileCompleted", value);
  }

  static bool getProfileCompleted() {
    return _prefs.getBool("profileCompleted") ?? false;
  }

  static Future<void> setProfileImage(String image) async {
    await _prefs.setString("profile_image", image);
  }

  static String? getProfileImage() {
    return _prefs.getString("profile_image");
  }




  static Future<void> setState(String value) async {
    await _prefs.setString("state", value);
  }

  static String? getState() {
    return _prefs.getString("state");
  }

  static Future<void> setCity(String value) async {
    await _prefs.setString("city", value);
  }

  static String? getCity() {
    return _prefs.getString("city");
  }

  static Future<void> setPincode(String value) async {
    await _prefs.setString("pincode", value);
  }

  static String? getPincode() {
    return _prefs.getString("pincode");
  }

  static Future<void> saveStoreId(int id) async {
    await _prefs.setInt("storeId", id);
  }

  static int? getStoreId() {
    return _prefs.getInt("storeId");
  }

  static Future<void> saveStoreQrId(String qrId) async {
    await _prefs.setString("storeQrId", qrId);
  }

  static String? getStoreQrId() {
    return _prefs.getString("storeQrId");
  }

  static Future<void> saveQRList(List<QRModel> list) async {
    final data = list.map((e) => {
      "id": e.id,
      "imageUrl": e.imageUrl,
      "isDefault": e.isDefault,
    }).toList();

    await _prefs.setString("qr_list", jsonEncode(data));
  }

  static Future<List<QRModel>?> getQRList() async {
    final data = _prefs.getString("qr_list");

    if (data == null) return null;

    final decoded = jsonDecode(data);

    return List<QRModel>.from(
      decoded.map((e) => QRModel(
        id: e["id"],
        imageUrl: e["imageUrl"],
        isDefault: e["isDefault"],
      )),
    );
  }
  static Future<void> setStoreKeeperId(int id) async {
    await _prefs.setInt("storeKeeperId", id);
  }

  static int? getStoreKeeperId() {
    return _prefs.getInt("storeKeeperId");
  }
  static Future<void> setEmail(String trim) async {
  }
  static Future<void> setName(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('shopkeeper_name', name);
  }

  static Future<void> setStoreName(String storeName) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('shopkeeper_store_name', storeName);
  }

  static Future<String?> getName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('shopkeeper_name');
  }

  static Future<String?> getStoreName() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('shopkeeper_store_name');
  }

}