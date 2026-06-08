class StoreModel {
  int? id;
  String? storeKeeperName;
  String? storeName;
  String? addressLine1;
  String? addressLine2;
  String? storeQrId;
  String? message;

  StoreModel({
    this.id,
    this.storeKeeperName,
    this.storeName,
    this.addressLine1,
    this.addressLine2,
    this.storeQrId,
    this.message,
  });

  StoreModel.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    storeKeeperName = json['storeKeeperName'];
    storeName = json['storeName'];
    addressLine1 = json['addressLine1'];
    addressLine2 = json['addressLine2'];
    storeQrId = json['storeId'];
    message = json['message'];
  }
}