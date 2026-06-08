class AddressModel {
  final int id;
  final String name;
  final String mobileNumber;
  final String addressLine1;
  final String addressLine2;
  final String landmark;
  final String city;
  final String state;
  final String pincode;
   bool isDefault;

  AddressModel({
    required this.id,
    required this.name,
    required this.mobileNumber,
    required this.addressLine1,
    required this.addressLine2,
    required this.landmark,
    required this.city,
    required this.state,
    required this.pincode,
    this.isDefault=false,
  });

  factory AddressModel.fromJson(Map<String, dynamic> json) {
    return AddressModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? "",
      mobileNumber: json['mobileNumber'] ?? "",
      addressLine1: json['addressLine1'] ?? "",
      addressLine2: json['addressLine2'] ?? "",
      landmark: json['landmark'] ?? "",
      city: json['city'] ?? "",
      state: json['state'] ?? "",
      pincode: json['pincode']?.toString() ?? "",
      isDefault: json['isDefault'] == true,
    );
  }
  Map<String, dynamic> toJson() {

    return {

      "id": id,

      "name": name,

      "mobileNumber": mobileNumber,

      "addressLine1": addressLine1,

      "addressLine2": addressLine2,

      "landmark": landmark,

      "city": city,

      "state": state,

      "pincode": pincode,

      "isDefault": isDefault,

    };

  }
  String get fullAddress {
    return "$addressLine1, $addressLine2, $landmark, $city, $state"
        .replaceAll(RegExp(r',\s*,+'), ',')
        .trim();
  }
  }


