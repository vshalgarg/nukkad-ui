import 'package:flutter/material.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../services/address_service.dart';
import '../widgets/custom_text_field.dart';
import '../state_city_data/state_city.dart';
class AddAddressScreen extends StatefulWidget {
  const AddAddressScreen({super.key});

  @override
  State<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends State<AddAddressScreen> {
  final _formKey = GlobalKey<FormState>();

  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController address1Ctrl = TextEditingController();
  final TextEditingController address2Ctrl = TextEditingController();
  final TextEditingController landmarkCtrl = TextEditingController();
  final TextEditingController pincodeCtrl = TextEditingController();
  final TextEditingController numberCtrl = TextEditingController();
  String? selectedState;
  String? selectedCity;
  Widget buildLabel(String text, {bool required = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: RichText(
        text: TextSpan(
          text: text,
          style: const TextStyle(
            color: Colors.black,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
          children: required
              ? const [
            TextSpan(
              text: ' *',
              style: TextStyle(color: Colors.red),
            )
          ]
              : [],
        ),
      ),
    );
  }
  Widget customDropdown({
    required String hint,
    required String?value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      hint: Text(hint),
      items: items
          .map(
            (item) =>
            DropdownMenuItem(
              value: item,
              child: Text(item),
            ),
      )
          .toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        contentPadding: const EdgeInsets.symmetric(
            horizontal: 20, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
          borderSide: BorderSide(color: Colors.black),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: Colors.black),
          borderRadius: BorderRadius.circular(30),
        ),
      ),
    );
  }
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final width = size.width;
    final height = size.height;
    return Scaffold(
        backgroundColor: Colors.white,
        body: Column(
            children: [
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      //  Back Arrow (left)
                      Align(
                        alignment: Alignment.centerLeft,
                        child: GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: const Icon(Icons.arrow_back_ios, size: 20),
                        ),
                      ),

                      //  Center Title
                      Text(
                        "Add Delivery Address",
                        style: TextStyle(
                          fontSize: width * 0.055,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                  child: SingleChildScrollView(
                      padding: EdgeInsets.all(width * 0.04),
                      child: Form(
                          key: _formKey,
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                buildLabel('Name', required: true),
                                CustomTextField(
                                  hint: 'Enter name',
                                  controller: nameCtrl,
                                ),
                                SizedBox(height: height * 0.02),
                                buildLabel('Mobile Number', required: true),
                                CustomTextField(
                                  hint: 'Enter mobile number',
                                  controller: numberCtrl,
                                  keyboardType: TextInputType.phone,
                                  maxLength: 10,

                                ),
                                SizedBox(height: height * 0.02),
                                buildLabel('Address Line 1', required: true),
                                CustomTextField(
                                  hint: 'Address line 1',
                                  controller: address1Ctrl,
                                ),

                                SizedBox(height: height * 0.02),
                                buildLabel('Address Line 2'),
                                CustomTextField(
                                  hint: 'Address line 2',
                                  controller: address2Ctrl,
                                ),

                                SizedBox(height: height * 0.02),
                                buildLabel('Landmark', required: true),
                                CustomTextField(
                                  hint: 'Landmark',
                                  controller: landmarkCtrl,
                                ),

                                SizedBox(height: height * 0.02),
                                buildLabel('State', required: true),
                                customDropdown(
                                  hint: 'Select State',
                                  value: selectedState,
                                  items: stateCityList
                                      .map((e) => e.stateName)
                                      .toList(),
                                  onChanged: (value) {
                                    setState(() {
                                      selectedState = value;
                                      selectedCity = null;
                                    });
                                  },
                                ),

                                SizedBox(height: height * 0.02),
                                buildLabel('City', required: true),
                                customDropdown(
                                    hint: 'Select City',
                                    value: selectedCity,
                                    items: selectedState == null ? []
                                        : stateCityList
                                        .firstWhere((e) =>
                                    e.stateName == selectedState)
                                        .cities,
                                    onChanged: (value) {
                                      setState(() {
                                        selectedCity = value;
                                      });
                                    }
                                ),

                                SizedBox(height: height * 0.01),
                                buildLabel('Pincode', required: true),
                                CustomTextField(
                                  hint: 'Pincode',
                                  controller: pincodeCtrl,
                                  keyboardType: TextInputType.number,
                                  maxLength: 6,
                                ),
                                SizedBox(height: height * 0.1),
                                ]
                          ),
                      ),
                  ),
              ),
        ]),

                          bottomNavigationBar: SafeArea(
                              child: Padding(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: width * 0.05,
                                    vertical: height * 0.015,
                                  ),
                                  child: SizedBox(
                                      width: width*0.45,
                                      height: height * 0.045,
                                      child: ElevatedButton(
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: Colors.green,
                                            shape: RoundedRectangleBorder(
                                              borderRadius: BorderRadius.circular(30),
                                            ),
                                            elevation: 4,
                                          ),
                                  onPressed: () async {
                                    if (!_formKey.currentState!.validate()) {
                                      log.w("Form validation failed");
                                      return;
                                    }

                                    if (selectedState == null || selectedCity == null) {
                                      log.w("State or City not selected");
                                      return;
                                    }
                                    log.i("CustomerId: ${LocalStorageService.getUserId()}");
                                    log.d("Creating address with data:");
                                    log.d({
                                      "name": nameCtrl.text,
                                      "mobileNumber": numberCtrl.text,
                                      "addressLine1": address1Ctrl.text,
                                      "city": selectedCity,
                                      "state": selectedState,
                                      "pincode": pincodeCtrl.text,
                                    });
                                    final address = await AddressService.createAddress({
                                          "name": nameCtrl.text,
                                          "mobileNumber": numberCtrl.text,
                                          "addressLine1": address1Ctrl.text,
                                          "addressLine2": address2Ctrl.text,
                                          "landmark": landmarkCtrl.text,
                                          "city": selectedCity,
                                          "state": selectedState,
                                          "pincode": pincodeCtrl.text,
                                          "isDefault": false
                                       });
                                      if (address != null) {
                                        log.i("Address created successfully: ID = ${address.id}");
                                        Navigator.pop(context, true);
                                      }else{
                                        log.e("Failed to create address");
                                      }

                                    },
                                     child: Center(child: Text("Continue", style: TextStyle(
                                       fontSize: width * 0.045,
                                       color: Colors.white,)),
                                  )
                          )
    )
                              )
                          ));
  }
  @override
  void dispose() {
    nameCtrl.dispose();
    address1Ctrl.dispose();
    address2Ctrl.dispose();
    landmarkCtrl.dispose();
    pincodeCtrl.dispose();
    numberCtrl.dispose();
    super.dispose();
  }
}

