class ProfileModel {
  final int id;
  final String name;
  final String phone;
  final String email;
  final String dob;
  final String? image;
  ProfileModel({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    required this.dob,
    this.image,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      dob: json["dob"],
      id: json["id"],
      name: json["name"] ?? "",
      phone: json["mobileNumber"] ?? "",
      email: json["email"] ?? "",
      image: json['image'],
    );
  }
}