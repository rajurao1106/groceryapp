import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import 'package:grocery_app/core/constants/app_colors.dart';

class CatalogProductImage extends StatelessWidget {
  const CatalogProductImage({
    required this.image,
    super.key,
    this.fit = BoxFit.cover,
    this.emojiFontSize = 48,
  });

  final String image;
  final BoxFit fit;
  final double emojiFontSize;

  @override
  Widget build(BuildContext context) {
    final uri = Uri.tryParse(image);
    final isNetworkImage =
        uri != null &&
        (uri.scheme == 'http' || uri.scheme == 'https') &&
        uri.host.isNotEmpty;

    if (!isNetworkImage) {
      return ColoredBox(
        color: AppColors.surfaceVariant,
        child: Center(
          child: Text(
            image.isEmpty ? '🛒' : image,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: emojiFontSize),
          ),
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: image,
      fit: fit,
      placeholder: (context, url) =>
          const ColoredBox(color: AppColors.surfaceVariant),
      errorWidget: (context, url, error) => const ColoredBox(
        color: AppColors.surfaceVariant,
        child: Center(child: Icon(Icons.image_not_supported_outlined)),
      ),
    );
  }
}
