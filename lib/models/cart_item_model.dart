class CartItemModel{
  final int id;
  final int itemId;
  final String name;
  final String image;
  double quantity;
 String unit;
  final List<String> units;
 CartItemModel ({
   required this.id,
   required this.itemId,
    required this.name,
    required this.image,
   required this.quantity,
   required this.unit,
   required this.units,
  });
factory CartItemModel.fromJson(Map<String, dynamic> json) {

return CartItemModel(
  id: json['id'],
itemId: json['itemId'],
  name: json['itemName'],
  image: json['imageUrls'] != null && json['imageUrls'].length > 0
      ? json['imageUrls'][0]
      : '',
  quantity: (json['quantity'] as num).toDouble(),
unit: json['selectedUnit'],
  units: List<String>.from(json['allUnits']),
);
}
Map<String, dynamic> toJson() {

return {
'id': itemId,
'name': name,
'image': image,
'quantity': quantity,
'unit': unit,
};
}
}
