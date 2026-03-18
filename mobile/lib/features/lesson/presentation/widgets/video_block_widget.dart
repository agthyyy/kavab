import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class VideoBlockWidget extends StatefulWidget {
  final String url;
  final String? title;
  const VideoBlockWidget({super.key, required this.url, this.title});

  @override
  State<VideoBlockWidget> createState() => _VideoBlockWidgetState();
}

class _VideoBlockWidgetState extends State<VideoBlockWidget> {
  late VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) setState(() => _initialized = true);
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.title != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Text(widget.title!,
                style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: _initialized
              ? AspectRatio(
                  aspectRatio: _controller.value.aspectRatio,
                  child: Stack(
                    alignment: Alignment.bottomCenter,
                    children: [
                      VideoPlayer(_controller),
                      _VideoControls(controller: _controller),
                    ],
                  ),
                )
              : Container(
                  height: 200,
                  color: Colors.black,
                  child: const Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                ),
        ),
      ],
    );
  }
}

class _VideoControls extends StatefulWidget {
  final VideoPlayerController controller;
  const _VideoControls({required this.controller});

  @override
  State<_VideoControls> createState() => _VideoControlsState();
}

class _VideoControlsState extends State<_VideoControls> {
  @override
  void initState() {
    super.initState();
    widget.controller.addListener(() {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    final isPlaying = widget.controller.value.isPlaying;
    final position = widget.controller.value.position;
    final duration = widget.controller.value.duration;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.transparent, Colors.black54],
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Row(
        children: [
          IconButton(
            icon: Icon(isPlaying ? Icons.pause : Icons.play_arrow,
                color: Colors.white),
            onPressed: () {
              isPlaying
                  ? widget.controller.pause()
                  : widget.controller.play();
            },
          ),
          Expanded(
            child: VideoProgressIndicator(
              widget.controller,
              allowScrubbing: true,
              colors: const VideoProgressColors(
                playedColor: Color(0xFFC8860A),
                bufferedColor: Colors.white38,
                backgroundColor: Colors.white24,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '${_fmt(position)} / ${_fmt(duration)}',
            style: const TextStyle(color: Colors.white, fontSize: 12),
          ),
        ],
      ),
    );
  }

  String _fmt(Duration d) =>
      '${d.inMinutes.toString().padLeft(2, '0')}:${(d.inSeconds % 60).toString().padLeft(2, '0')}';
}
