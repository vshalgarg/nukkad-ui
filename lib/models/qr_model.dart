class QRModel {
  final String id;
  final String imageUrl;
  final bool isDefault;

  QRModel({
    required this.id,
    required this.imageUrl,
    required this.isDefault,
  });

  factory QRModel.fromJson(Map<String, dynamic> json) {
    String raw = json['qrImageUrl'] ?? "";

    String image = "";

    if (raw.startsWith("data:image")) {
      image = raw;
    } else if (raw.startsWith("/9j")) {
      image = raw;
    }

    return QRModel(
      id: json['id'].toString(),
      imageUrl: image,
      isDefault: json['default'] ?? false,
    );
  }
}