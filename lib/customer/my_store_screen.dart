import 'package:codemonks_nukkad/models/store_model.dart';
import 'package:codemonks_nukkad/customer/add_store_screen.dart';
import 'package:flutter/material.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../services/store_service.dart';
import '../services/store_storage.dart';
class MyStoreScreen extends StatefulWidget{
  const MyStoreScreen({super.key});
  @override
  State<MyStoreScreen> createState()=> _MyStoreScreenState();

}

class _MyStoreScreenState extends State <MyStoreScreen>{
  int selectedIndex=0;
  List<StoreModel> stores = [];
  bool isLoading = true;
  @override
  void initState() {
    super.initState();
    loadStores();
  }

  Future<void> loadStores() async {

    final data = await StoreService.getMyStores();

    setState(() {
      stores = data;
      isLoading = false;
    });
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("My Stores"),
        centerTitle: true,
        leading:IconButton(
          icon:const Icon(Icons.arrow_back),
          onPressed: ()=>
              Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          SizedBox(height: 16,),
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : stores.isEmpty
                ? const Center(
              child: Text("No stores found. Please add a store."),
            )
                : ListView.builder(
                itemCount: stores.length,
                itemBuilder: (context,index){
                  final store= stores[index];
                  final isSelected=selectedIndex==index;
                  return GestureDetector(
                    onTap: (){
                      setState(() {
                        selectedIndex=index;
                      });
                    },
                    child: Container(
                      margin: EdgeInsets.symmetric(horizontal: 16,vertical: 8),
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isSelected? Colors.green:
                        Colors.grey.shade300,
                          width: 2,),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(store.storeName??"",style: TextStyle(fontSize: 16,
                              fontWeight: FontWeight.bold),),
                          SizedBox(height: 6,),
                          Text(store.addressLine1??"",style: TextStyle(
                              color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                    ),
                  );
                }
            ),
          ),
          Padding(
            padding: EdgeInsets.all(50),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
              onPressed: () async {
                final result = await Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const AddStoreScreen(),
                  ),
                );

                if (result != null) {
                  setState(() {
                    stores.add(
                      StoreModel(
                        storeName: result,
                        addressLine1: "Added Store",
                      ),
                    );
                  });
                }
              },
                    child: const Text("Add Store",
                    style: TextStyle(
                      color: Colors.white
                    ),),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                    ),
    onPressed: () async {
    final selectedStore = stores[selectedIndex];

    log.i("SELECTED STORE ID: ${selectedStore.id}");
    log.i("SELECTED STORE NAME: ${selectedStore.storeName}");
    if (selectedStore.id == null || selectedStore.id == 0) {
    ScaffoldMessenger.of(context).showSnackBar(
    const SnackBar(content: Text("Invalid store selected")),
    );
    return;
    }

    await StoreStorage.saveStores([selectedStore.storeName ?? ""]);
    await LocalStorageService.saveStoreQrId(selectedStore.storeQrId ?? "");
    await LocalStorageService.saveStoreId(selectedStore.id!);

    log.i("SAVED STORE ID: ${selectedStore.id}");

    Navigator.pop(context, selectedStore);
    },
                    child: const Text("Select Store",
                  style: TextStyle(
                  color: Colors.white),
                  ),
                ),
                )],
            ),
          ),
        ],
      ),
    );
  }
}