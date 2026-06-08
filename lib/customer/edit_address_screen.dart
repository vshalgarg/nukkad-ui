import 'package:flutter/material.dart';
import '../models/address_model.dart';
import '../services/address_service.dart';

class EditAddressScreen extends StatefulWidget {
  final AddressModel address;

  const EditAddressScreen({super.key, required this.address});

  @override
  State<EditAddressScreen> createState() => _EditAddressScreenState();
}

class _EditAddressScreenState extends State<EditAddressScreen> {

  late TextEditingController nameCtrl;
  late TextEditingController phoneCtrl;
  late TextEditingController address1Ctrl;
  late TextEditingController address2Ctrl;
  late TextEditingController landmarkCtrl;
  late TextEditingController pincodeCtrl;

  String stateValue = "";
  String cityValue = "";

  bool isSaving = false;

  @override
  void initState() {
    super.initState();

    final a = widget.address;

    nameCtrl = TextEditingController(text: a.name);
    phoneCtrl = TextEditingController(text: a.mobileNumber);
    address1Ctrl = TextEditingController(text: a.addressLine1);
    address2Ctrl = TextEditingController(text: a.addressLine2);
    landmarkCtrl = TextEditingController(text: a.landmark);
    pincodeCtrl = TextEditingController(text: a.pincode);

    stateValue = a.state;
    cityValue = a.city;
  }

  Future<void> updateAddress() async {

    setState(() {
      isSaving = true;
    });

    final updated = await AddressService.updateAddress(
      widget.address.id,
      {
        "name": nameCtrl.text,
        "mobileNumber": phoneCtrl.text,
        "addressLine1": address1Ctrl.text,
        "addressLine2": address2Ctrl.text,
        "landmark": landmarkCtrl.text,
        "city": cityValue,
        "state": stateValue,
        "pincode": pincodeCtrl.text,
        "isDefault": widget.address.isDefault
      },
    );

    setState(() {
      isSaving = false;
    });

    if (updated != null) {
      Navigator.pop(context, updated);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Failed to update address")),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Edit Address")),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [

            _field("Name", nameCtrl),
            _field("Mobile Number", phoneCtrl),
            _field("Address Line 1", address1Ctrl),
            _field("Address Line 2", address2Ctrl, required: false),
            _field("Landmark", landmarkCtrl),

            _dropdown(
              "State",
              stateValue,
              ["Delhi", "Haryana"],
                  (v) => setState(() => stateValue = v!),
            ),

            _dropdown(
              "City",
              cityValue,
              ["North Delhi", "South Delhi", "Gurgaon"],
                  (v) => setState(() => cityValue = v!),
            ),

            _field("Pincode", pincodeCtrl),

            const SizedBox(height: 20),

            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
                padding: const EdgeInsets.symmetric(
                  horizontal: 80,
                  vertical: 14,
                ),
              ),
              onPressed: isSaving ? null : updateAddress,
              child: isSaving
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text("Update Address"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _field(String label, TextEditingController controller,
      {bool required = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          labelText: required ? "$label *" : label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
          ),
        ),
      ),
    );
  }

  Widget _dropdown(
      String label,
      String value,
      List<String> items,
      Function(String?) onChanged,
      ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: DropdownButtonFormField<String>(
        initialValue: items.contains(value) ? value : null,
        decoration: InputDecoration(
          labelText: "$label *",
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(30),
          ),
        ),
        items: items
            .map((e) => DropdownMenuItem(value: e, child: Text(e)))
            .toList(),
        onChanged: onChanged,
      ),
    );
  }
}