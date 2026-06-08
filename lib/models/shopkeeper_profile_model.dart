class StorekeeperModel {
  final int id;
  final String name;
  final String storeName;
  final String gstNum;
  final String addressLine1;
  final String addressLine2;
  final String city;
  final String state;
  final String pincode;
  final String landmark;
  final String mobileNumber;
  final String contactNumber;
  final String storeQrId;
  final List<String> imageUrls;

  StorekeeperModel({
    required this.id,
    required this.name,
    required this.storeName,
    required this.gstNum,
    required this.addressLine1,
    required this.addressLine2,
    required this.city,
    required this.state,
    required this.pincode,
    required this.landmark,
    required this.mobileNumber,
    required this.contactNumber,
    required this.storeQrId,
    required this.imageUrls,
  });

  factory StorekeeperModel.fromJson(Map<String, dynamic> json) {
    return StorekeeperModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      storeName: json['storeName'] ?? '',
      gstNum: json['gstNum'] ?? '',
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'] ?? '',
      city: json['city'] ?? '',
      state: json['state'] ?? '',
      pincode: json['pincode'] ?? '',
      landmark: json['landmark'] ?? '',
      mobileNumber: json['mobileNumber'] ?? '',
      contactNumber: json['contactNumber'] ?? '',
      storeQrId: json['storeQrId'] ?? '',
      imageUrls: List<String>.from(json['imageUrls'] ?? []),
    );
  }
}