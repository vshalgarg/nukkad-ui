class Product {
  final int id;
  final String name;
  final String image;

  Product({
    required this.id,
    required this.name,
    required this.image,
  });
}

class ProductModel {
  final int id;
  final int categoryId;
  final String name;
  final String image;
  double quantity;
  String unit;
  bool isAdded;


  ProductModel({
    required this.id,
    required this.categoryId,
    required this.name,
    required this.image,
    this.isAdded=false,
    this.quantity=0,
    this.unit='KG',
  });
}
