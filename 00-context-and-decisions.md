# 00 — Context & Decisions

## Product

A native desktop media player for Windows, macOS and Linux that is a **functional and
visual clone of QQPlayer** (see `images/`). Not a skin — the same interactions, the same
panels, the same tools, on all three OSes.

### Feature inventory (from the screenshots — this is the full scope)

1. **Main window**: title bar (app menu chevron, centered filename, always-on-top pin,
   min/max/close), video surface, bottom control strip (time, stop, prev, play, next,
   volume, screenshot, playlist, fullscreen), empty-state "Open File" drop zone.
2. **Context menu** (right-click on video): Open File (Ctrl+O), Open Folder (Ctrl+F),
   Open URL (Ctrl+U), Full Screen (Enter), Normal Screen, Minimal Screen (Shift+Enter),
   Always-on-top (T), Play Mode ▸, Playback ▸, Sound ▸, Subtitles ▸ (Load / Loaded ▸
   Disable / Style / Sync), Tools ▸, Playlist (F3), Control Panel (F4), Settings (F5),
   File Properties.
3. **Playlist drawer**: thumbnails + durations, loop-mode menu (Single, Order, Loop,
   Single Loop [shown as "Signal Loop" in the UI copy — keep the typo out, use
   "Single Loop"], Random).
4. **Control Panel** (right-side flyout, 4 tabs):
   - Playback: FF/Rewind step (5s/10s/30s radio), speed (0.5x/1x/1.5x/2x), volume
     slider up to 10x, Reset.
   - Effects: aspect ratio (Default/4:3/16:9/Fill radio), brightness/saturation/
     contrast/hue sliders, three one-tap color presets (Default / Bright / Soft),
     Reset.
   - Subtitle Sync: Primary subtitle (dropdown + Load button, sync +/- in seconds),
     Secondary subtitle (same), Reset.
   - Subtitle Style: font family, size, color, outline, position presets.
5. **Progress bar with hover preview thumbnails** (hover scrub → small thumbnail +
   timestamp, bottom-right of cursor like `images/07-preview-thumbnail.png`).
6. **Video/Audio Converter window** (separate): add files, per-file progress table,
   format/video/audio settings (codec, bitrate, fps, size, quality), output folder,
   Start/Stop, optional auto-shutdown.
7. **Video Audio Cutter window** (separate): preview, dual-handle trim range, preview
   speed 1x/2x, filename, resolution, format, quality, compression estimate, Save.

## Why this stack (do not re-litigate without new evidence)

- **libmpv** (via `tauri-plugin-libmpv`) decodes *everything* (MKV, ASS/SSA subtitles,
  multi-audio, chapters, HEVC/AV1/10-bit) with hardware acceleration and zero-copy GPU
  rendering. Browser `<video>` gives an inconsistent codec matrix per OS — that kills
  the "comprehensive" goal.
- **Tauri 2**: 3–10 MB binary vs Electron's ~100 MB+, OS webview, Rust core for the
  thin relay. The Rust we write is a command/event relay only (~300–500 lines,
  agent-generated). ~95% of code is React/TypeScript.
- **React + TypeScript + Zustand + Tailwind**: fastest path to the pixel-faithful dark
  UI in the screenshots, and the stack the developer already knows.
- **FFmpeg CLI sidecar** for Converter/Cutter/thumbnails: runs as a separate process,
  parseable progress, cancellable with kill — never blocks the UI thread.

## Hard constraints

- No network calls at runtime except opening user-provided URLs in the player.
- No telemetry, no auto-update in v1.
- Works fully offline. Single instance (second launch focuses existing window and
  opens the file passed on argv).
- GPL notice: libmpv/FFmpeg are GPL by default. Ship the license text and source
  offer in the installer. (LGPL-only rebuild is a later option — NOT in scope now.)
- Codespaces/dev containers cannot show GUI: develop logic headless, test UI via
  GitHub Actions matrix builds (win/mac/linux) on real machines.
