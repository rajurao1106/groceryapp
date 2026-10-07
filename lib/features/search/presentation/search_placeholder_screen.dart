import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:speech_to_text/speech_to_text.dart';

import 'package:grocery_app/core/constants/app_colors.dart';
import 'package:grocery_app/features/home/domain/home_repository.dart';
import 'package:grocery_app/features/home/presentation/product_card.dart';
import 'package:grocery_app/features/search/data/mock_search_repository.dart';
import 'package:grocery_app/features/wishlist/presentation/wishlist_controller.dart';

class SearchPlaceholderScreen extends ConsumerStatefulWidget {
  const SearchPlaceholderScreen({super.key});

  @override
  ConsumerState<SearchPlaceholderScreen> createState() =>
      _SearchPlaceholderScreenState();
}

class _SearchPlaceholderScreenState
    extends ConsumerState<SearchPlaceholderScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final SpeechToText _speechToText = SpeechToText();

  Timer? _debounce;
  List<String> _recentSearches = const [];
  List<String> _popularSuggestions = const [];
  List<HomeProduct> _results = const [];
  bool _isLoading = false;
  bool _isListening = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
      _loadSuggestions();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    _speechToText.stop();
    super.dispose();
  }

  Future<void> _loadSuggestions() async {
    final repository = ref.read(searchRepositoryProvider);
    final recent = await repository.getRecentSearches();
    final popular = await repository.getPopularSuggestions();

    if (!mounted) {
      return;
    }

    setState(() {
      _recentSearches = recent;
      _popularSuggestions = popular;
    });
  }

  Future<void> _performSearch(String rawQuery) async {
    final query = rawQuery.trim();

    if (query.isEmpty) {
      setState(() {
        _results = const [];
        _isLoading = false;
        _errorMessage = '';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final repository = ref.read(searchRepositoryProvider);
      final results = await repository.search(query);
      if (!mounted) {
        return;
      }

      setState(() {
        _results = results;
        _isLoading = false;
      });

      await repository.addRecentSearch(query);
      await _loadSuggestions();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _results = const [];
        _isLoading = false;
        _errorMessage = 'Something went wrong while searching.';
      });
    }
  }

  void _onQueryChanged(String value) {
    if (_debounce?.isActive ?? false) {
      _debounce!.cancel();
    }

    _debounce = Timer(const Duration(milliseconds: 400), () {
      _performSearch(value);
    });
  }

  Future<void> _handleMicTap() async {
    final status = await Permission.microphone.request();

    if (status.isDenied || status.isPermanentlyDenied) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Microphone permission is required to use voice search.',
          ),
        ),
      );
      return;
    }

    final available = await _speechToText.initialize(
      onStatus: (status) {
        if (!mounted) {
          return;
        }

        setState(() {
          _isListening = status == 'listening';
        });

        if (status == 'done' || status == 'notListening') {
          if (Navigator.canPop(context)) {
            Navigator.pop(context);
          }
        }
      },
      onError: (error) {
        if (!mounted) {
          return;
        }

        setState(() {
          _isListening = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Voice search error: ${error.errorMsg}')),
        );
      },
    );

    if (!available || !mounted) {
      return;
    }

    _showListeningSheet();
    _speechToText.listen(
      onResult: (result) {
        if (!mounted) {
          return;
        }

        final text = result.recognizedWords.trim();
        if (text.isEmpty) {
          return;
        }

        _searchController.text = text;
        _searchController.selection = TextSelection.collapsed(
          offset: text.length,
        );
        _onQueryChanged(text);
      },
    );
  }

  void _showListeningSheet() {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetContext) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0.9, end: 1.2),
                duration: const Duration(milliseconds: 900),
                curve: Curves.easeInOut,
                builder: (context, value, child) {
                  return Transform.scale(scale: value, child: child);
                },
                child: Container(
                  width: 86,
                  height: 86,
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.mic_rounded,
                    size: 38,
                    color: AppColors.primaryGreen,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Listening...',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Speak now to search for groceries',
                style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 18),
              TextButton(
                onPressed: () {
                  _speechToText.stop();
                  if (Navigator.canPop(sheetContext)) {
                    Navigator.pop(sheetContext);
                  }
                },
                child: const Text('Stop'),
              ),
            ],
          ),
        );
      },
    );
  }

  void _applySuggestion(String suggestion) {
    _searchController.text = suggestion;
    _searchController.selection = TextSelection.collapsed(
      offset: suggestion.length,
    );
    _onQueryChanged(suggestion);
    _searchFocusNode.requestFocus();
  }

  void _clearRecent() async {
    final repository = ref.read(searchRepositoryProvider);
    await repository.clearRecentSearches();
    await _loadSuggestions();
  }

  Widget _buildSuggestions() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      children: [
        if (_recentSearches.isNotEmpty) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Recent searches',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              TextButton(
                onPressed: _clearRecent,
                child: const Text('Clear all'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _recentSearches
                .map(
                  (item) => ActionChip(
                    label: Text(item),
                    onPressed: () => _applySuggestion(item),
                    backgroundColor: AppColors.surface,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 20),
        ],
        const Text(
          'Popular suggestions',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _popularSuggestions
              .map(
                (item) => ActionChip(
                  label: Text(item),
                  onPressed: () => _applySuggestion(item),
                  backgroundColor: AppColors.surface,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final hasQuery = _searchController.text.trim().isNotEmpty;
    final wishlistIds = ref.watch(wishlistControllerProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        automaticallyImplyLeading: false,
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        title: Container(
          height: 48,
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: TextField(
            controller: _searchController,
            focusNode: _searchFocusNode,
            autofocus: true,
            onChanged: _onQueryChanged,
            decoration: InputDecoration(
              hintText: 'Search groceries, fruits & more',
              prefixIcon: const Icon(
                Icons.search_rounded,
                color: AppColors.textMuted,
              ),
              suffixIcon: IconButton(
                icon: Icon(
                  _isListening ? Icons.mic_rounded : Icons.mic_none_rounded,
                  color: _isListening
                      ? AppColors.primaryGreen
                      : AppColors.textMuted,
                ),
                onPressed: _handleMicTap,
              ),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
          ),
        ),
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primaryGreen),
            )
          : hasQuery
          ? (_errorMessage.isNotEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(
                            Icons.error_outline_rounded,
                            size: 42,
                            color: AppColors.error,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Something went wrong',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _errorMessage,
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : _results.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Text(
                        'No results for "${_searchController.text.trim()}"',
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  )
                : GridView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.76,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final product = _results[index];
                      return ProductCard(
                        product: product,
                        onTap: () => context.push('/product/${product.id}'),
                        isFavourite: wishlistIds.contains(product.id),
                        onFavouriteTap: () async {
                          await ref
                              .read(wishlistControllerProvider.notifier)
                              .toggle(product.id);
                        },
                      );
                    },
                  ))
          : _buildSuggestions(),
    );
  }
}
