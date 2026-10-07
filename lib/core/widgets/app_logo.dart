import 'package:flutter/material.dart';
import 'package:grocery_app/core/constants/app_colors.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 72, this.showText = true});

  final double size;
  final bool showText;

  @override
  Widget build(BuildContext context) {
    final logo = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primaryGreen,
        borderRadius: BorderRadius.circular(size * 0.22),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreen.withValues(alpha: 0.2),
            blurRadius: 16,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Icon(
        Icons.local_grocery_store_rounded,
        size: size * 0.55,
        color: Colors.white,
      ),
    );

    if (!showText) {
      return logo;
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        logo,
        const SizedBox(height: 12),
        Text(
          'GroceryGo',
          style: Theme.of(
            context,
          ).textTheme.headlineMedium?.copyWith(color: AppColors.textPrimary),
        ),
      ],
    );
  }
}
