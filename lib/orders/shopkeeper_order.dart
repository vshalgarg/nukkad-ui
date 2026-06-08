class OrderModel{
  final int id;
  final String customerName;
  final String phone;
  final String address;
  final String productName;
  final String productImage;
  final String weight;
  bool inStock;
  int price;
 final String landmark;
 final String orderStatus;
 final String orderDate;
  int orderId;
 final String updatedAt;
  final String storeName;

  var items;
 OrderModel({
    required this.id,
    required this.phone,
    required this.customerName,
    this.price=0,
    required this.address,
    required this.productName,
    required this.productImage,
    required this.weight,
    this.inStock=false,
   required this.orderId,
   required this.landmark,
   required this.orderStatus,
   required this.orderDate,
   required this.updatedAt,
   required this.storeName,
  });

}