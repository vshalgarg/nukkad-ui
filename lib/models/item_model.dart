class ItemModel {
  final int id;
  final String name;
  final List<String> unit;
  final List<String> imageUrls;
  final List<int> categoryIds;

  ItemModel({
    required this.id,
    required this.name,
    required this.unit,
    required this.imageUrls,
    required this.categoryIds,
  });

  factory ItemModel.fromJson(Map<String, dynamic> json) {
    return ItemModel(
      id: json['id'],
      name: json['name'],
      unit: List<String>.from(json['unit']),
      imageUrls: List<String>.from(json['imageUrls']),
      categoryIds: List<int>.from(json['categoryIds']),
    );
  }
}