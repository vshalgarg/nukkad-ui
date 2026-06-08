import 'package:url_launcher/url_launcher.dart';

class AppLinks {
  static const String helpAndSupport =
      "https://codemonks.in/app/help-and-support.html";

  static const String privacyPolicy =
      "https://codemonks.in/app/privacy-policy.html";

  static const String termsAndConditions =
      "https://codemonks.in/app/terms-and-condition.html";

  static Future<void> openUrl(String url) async {
    final Uri uri = Uri.parse(url);

    if (!await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    )) {
      throw Exception("Could not launch $url");
    }
  }
}
