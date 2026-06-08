import 'package:flutter/material.dart';
import '../common/logger.dart';
import '../db/local_storage.dart';
import '../services/customer_service.dart';
import '../widgets/custom_text_field.dart';
import '../state_city_data/state_city.dart';
import 'customer_dashboard.dart';

class CustomerForm extends StatefulWidget {
  final int userId;
  const CustomerForm({super.key, required this.userId});

  @override
  State<CustomerForm> createState() => _CustomerFormState();
}

class _CustomerFormState extends State<CustomerForm> {
  String name='';
  final _formKey = GlobalKey<FormState>();

  final TextEditingController nameCtrl = TextEditingController();
  final TextEditingController emailCtrl = TextEditingController();
  final TextEditingController address1Ctrl = TextEditingController();
  final TextEditingController address2Ctrl = TextEditingController();
  final TextEditingController landmarkCtrl = TextEditingController();
  final TextEditingController pincodeCtrl = TextEditingController();
  final TextEditingController dobCtrl = TextEditingController();

  String? selectedState;
  String? selectedCity;

  bool isLoading = false;

  Future<void> pickDate() async {
    DateTime? selectedDate = await showDatePicker(
      context: context,
      initialDate: DateTime(2000),
      firstDate: DateTime(1950),
      lastDate: DateTime.now(),
    );

    if (selectedDate != null) {
      setState(() {
        dobCtrl.text =
        "${selectedDate.year}-${selectedDate.month.toString().padLeft(2, '0')}-${selectedDate.day.toString().padLeft(2, '0')}";
      });
    }
  }
  Future<void> saveProfile() async {

    if (!_formKey.currentState!.validate()) return;

    setState(() => isLoading = true);

    try {

      final phone = LocalStorageService.getPhone();

      final body = {
        "name": nameCtrl.text.trim(),
        "email": emailCtrl.text.trim(),
        "dob": dobCtrl.text.trim(),
        "mobileNumber": phone,
        "addressLine1": address1Ctrl.text.trim(),
        "addressLine2": address2Ctrl.text.trim(),
        "landmark": landmarkCtrl.text.trim(),
        "city": selectedCity,
        "state": selectedState,
        "pincode": pincodeCtrl.text.trim(),
        "userId": widget.userId
      };

      final success = await CustomerService.createCustomer(body);

      if (success) {

         LocalStorageService.setProfileCompleted(true);
         LocalStorageService.setUserName(nameCtrl.text.trim());
         LocalStorageService.setEmail(emailCtrl.text.trim());

        if (!mounted) return;

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => const CustomerDashboard(),
          ),
        );

      } else {

        throw Exception("Customer creation failed");

      }

    } catch (e) {

      log.e("CREATE CUSTOMER ERROR: $e");

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error: $e")),
      );

    }

    setState(() => isLoading = false);

  }

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
    required String? value,
    required List<String> items,
    required Function(String?) onChanged,
  }) {
    return DropdownButtonFormField<String>(
      initialValue: value,
      hint: Text(hint),
      items: items
          .map((item) =>
          DropdownMenuItem(value: item, child: Text(item)))
          .toList(),
      onChanged: onChanged,
      decoration: InputDecoration(
        contentPadding:
        const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(30),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          Container(
            height: 120,
            width: double.infinity,
            decoration: const BoxDecoration(
              color: Colors.green,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(40),
                bottomRight: Radius.circular(40),
              ),
            ),
            alignment: Alignment.center,
            child: const Text(
              'My Profile',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
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
                    const SizedBox(height: 16),

                    buildLabel('Email', required: true),
                    CustomTextField(
                      hint: 'Enter email',
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                    ),
                    const SizedBox(height: 16),

                    buildLabel('Address Line 1', required: true),
                    CustomTextField(
                      hint: 'Address line 1',
                      controller: address1Ctrl,
                    ),
                    const SizedBox(height: 16),

                    buildLabel('Address Line 2'),
                    CustomTextField(
                      hint: 'Address line 2',
                      controller: address2Ctrl,
                    ),
                    const SizedBox(height: 16),

                    buildLabel('Landmark', required: true),
                    CustomTextField(
                      hint: 'Landmark',
                      controller: landmarkCtrl,
                    ),
                    const SizedBox(height: 16),

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
                    const SizedBox(height: 16),

                    buildLabel('City', required: true),
                    customDropdown(
                      hint: 'Select City',
                      value: selectedCity,
                      items: selectedState == null
                          ? []
                          : stateCityList
                          .firstWhere((e) =>
                      e.stateName == selectedState)
                          .cities,
                      onChanged: (value) {
                        setState(() {
                          selectedCity = value;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    buildLabel('Pincode', required: true),
                    CustomTextField(
                      hint: 'Pincode',
                      controller: pincodeCtrl,
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: 16),

                    buildLabel('DOB (Date Of Birth)', required: true),
                    CustomTextField(
                      hint: 'YYYY-MM-DD',
                      controller: dobCtrl,
                      readOnly: true,
                      onTap: pickDate,
                    ),
                    const SizedBox(height: 30),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : saveProfile,
                        child: isLoading
                            ? const CircularProgressIndicator(
                          color: Colors.white,
                        )
                            : const Text("Continue"),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}