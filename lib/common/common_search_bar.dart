import 'dart:async';
import 'logger.dart';
import 'package:flutter/material.dart';

class CommonSearchBar extends StatefulWidget {
  final Function(String)? onSearch;
 const CommonSearchBar({super.key, this.onSearch});

  @override
  State<CommonSearchBar> createState() => _CommonSearchBarState();
}

class _CommonSearchBarState extends State<CommonSearchBar> {
  final TextEditingController _controller = TextEditingController();
  Timer? _debounce;

  @override
  Widget build(BuildContext context) {
    log.d("CommonSearchBar build called");

    return Padding(
      padding: const EdgeInsets.all(12),
      child: TextField(
          controller: _controller,
          decoration: InputDecoration(
            hintText: 'Search here for anything you want..',
            prefixIcon: const Icon(Icons.search),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(30),
            ),
          ),
          onChanged: (value) {
            log.i("Typing: $value");
            if (_debounce?.isActive ?? false) {
              log.w("Cancelling previous debounce");
              _debounce!.cancel();
            }
            _debounce = Timer(const Duration(milliseconds: 500), () {
              final query = value.trim();
              log.d("Debounce triggered: $query");
              if (widget.onSearch != null) {
                log.i("Calling onSearch");
                widget.onSearch!(query);
              } else {
                log.e("onSearch is null");
              }
            });
          }
      ),
    );
  }
  @override
  void dispose() {
    log.w("Disposing CommonSearchBar");
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
    }
  }
