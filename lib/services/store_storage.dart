import 'package:shared_preferences/shared_preferences.dart';

class StoreStorage {

  static const String storeKey = "selected_store";

  static Future<void> saveStores(List<String> stores) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList("stores", stores);
  }
  static Future<void> addStore(String store) async {
    final prefs = await SharedPreferences.getInstance();

    List<String> stores = prefs.getStringList("stores") ?? [];

    if (!stores.contains(store)) {
      stores.add(store);
      await prefs.setStringList("stores", stores);
    }
  }
  static Future<List<String>> getStores() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getStringList("stores") ?? [];
  }
}