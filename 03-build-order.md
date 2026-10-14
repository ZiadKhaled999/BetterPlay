# 03 — Build Order (Milestones)

One milestone at a time. Each has: goal, files touched, explicit DO-NOT list, and an
acceptance checklist. A milestone is DONE only when every acceptance item passes on a
real machine (via CI-built binaries).

## M0 — Scaffold & contract (no UI yet)
- Vite + React + TS + Tailwind + Zustand; Tauri 2 skeleton; add `tauri-plugin-libmpv`
  and confirm it builds on all three OS via GitHub Actions matrix.
- Write `src/lib/mpv-contract.ts` in full (see `01-architecture.md`).
- Bundle libmpv + ffmpeg binaries per-OS (Windows first); document the bundling step.
- **DO NOT** write any UI component yet. **DO NOT** start the app manually in dev mode
  until the plugin surface renders black without crashing.
- Accept: `cargo build` + `npm run tauri build` green on win/mac/linux CI; empty window
  with an embedded (black) mpv surface.

## M1 — Playback core
- Open File (dialog + drag-drop + argv on second instance), Open Folder, Open URL.
- Play/pause/stop, prev/next within loaded folder, seek bar, volume, mute, fullscreen
  (F / double-click / Enter), wheel = volume, arrows = seek 5s / volume.
- `time` events throttled at 5 Hz; drag-wins rule implemented.
- **DO NOT** build the playlist UI, panels, or menus yet — a minimal list in devtools
  console is enough.
- Accept: MP4/MKV/AVI/HEVC play on all 3 OS; hwdec engaged (check `hwdec-current`);
  seek while paused shows the new frame; non-ASCII paths and spaces work; app exits
  cleanly (no orphaned mpv/ffmpeg processes).

## M2 — Chrome: title bar, bottom strip, context menu
- Custom title bar per `02-design-system.md` (drag to move, double-click maximize,
  pin = always-on-top with active state).
- Bottom strip pixel-matched: mono time, transport cluster, screenshot button
  (mpv screenshot-to-file into Pictures), playlist + fullscreen toggles.
- Full context menu (image 02) with working shortcuts: Ctrl+O/F/U, F3 playlist,
  F4 control panel, F5 settings, T always-on-top, Enter fullscreen, Shift+Enter
  minimal mode.
- **DO NOT** wire Play Mode/Subtitles/Tools submenu payloads yet — show the menu
  structure, items that need later milestones show as disabled.
- Accept: visual match to images 01/02; all shortcuts work; minimal mode hides title
  and bottom bars; double-click video toggles fullscreen.

## M3 — Playlist drawer + loop modes
- Drawer per image 03; thumbnails generated async by `thumbs.rs`; loop-mode menu
  (Single/Order/Loop/Single Loop/Random) mapped to mpv
  (`loop-file`, `loop-playlist`, `shuffle`) — verify exact mpv semantics in the
  manual before coding (see `05-agent-rules.md`).
- Playlist persisted (JSON in app data dir); "open folder" populates it.
- **DO NOT** add drag-reorder yet.
- Accept: mode switches behave exactly as QQPlayer (Random reshuffles without
  restarting current file, etc. — test each).

## M4 — Control Panel: Playback + Effects tabs
- Panel shell + tab rail; Playback tab (image 04): FF/rewind step radios (map to
  arrow-key seek amount), speed 0.5/1/1.5/2 (`speed` property), volume slider with
  10x max (`volume-max`), Reset per tab.
- Effects tab (image 05): aspect ratio radios (`video-aspect-override`,
  `panscan` for Fill — verify), four color sliders (`brightness/contrast/saturation/
  hue` −100..100), three preset swatches applying preset value tuples.
- Accept: changes apply live with zero-lag; Reset restores defaults; panel state
  persists across restarts.

## M5 — Subtitles: sync tab + style tab + context menu wiring
- Subtitle Sync tab (image 06): primary + secondary track dropdowns populated from
  `track-list` event, Load button (file dialog, `sub-add`/`secondary-sid` — verify),
  per-track delay buttons (`sub-delay`, `secondary-sub-delay` — verify names).
- Auto-load `.srt/.ass` next to the video file on load.
- Subtitle Style tab: font family/size/color/border/position → `sub-font`,
  `sub-font-size`, `sub-color`, `sub-border-size`, `sub-pos` (verify).
- Wire the context-menu Subtitles subtree.
- Accept: ASS styling renders; secondary subs show simultaneously; delays survive
  track switches; non-UTF-8 subs load (`sub-codepage` — verify).

## M6 — Preview thumbnails
- Hover on progress bar → thumbnail + timestamp pill (image 07). Generate on demand,
  cache to disk, 2-concurrent cap, invalidate on file change.
- **DO NOT** pre-generate entire files at load (that's a battery killer).
- Accept: hover feels instant after first generation; thumbnails correct to ±1s;
  window-edge clamping works.

## M7 — Converter window
- Separate Tauri window per image 08; queue table; settings form; ffmpeg sidecar jobs
  with `-progress` parsing; Start/Stop; output overwrite confirm; auto-shutdown
  (OS-specific — verify capability, disable on macOS if unsupported and hide the
  checkbox).
- **DO NOT** add hardware-encode flags in v1 (compatibility first).
- Accept: converts mp4→mp4 (h264/aac) and extracts audio; progress accurate; cancel
  leaves no partial file (write to `.part`, rename on success).

## M8 — Cutter window
- Separate window per image 09; dual-handle trim; preview range playback; Save runs
  ffmpeg `-ss -t -c copy` (fast, keyframe-aligned) plus optional re-encode quality
  modes; compression estimate is a rough `bitrate × duration` calc — label it
  "estimate".
- Accept: cut output starts/ends within 1s of handles in copy mode; re-encode mode
  exact to the frame.

## M9 — Settings & persistence
- Settings window (F5): default volume, screenshot format/dir, subtitle defaults,
  cache size, hwdec toggle (auto-safe / no), theme is fixed dark — do not add themes.
- All settings typed, validated with zod on load, corrupt-file → defaults + backup.

## M10 — Hardening & packaging
- Edge-case sweep: everything in `04-edge-cases.md` gets a test pass.
- CI matrix builds signed installers; bundled license texts; file associations
  (optional, Windows/macOS).
- Final acceptance: full checklist in `04-edge-cases.md` §Final on all three OSes.
