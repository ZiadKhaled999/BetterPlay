# 01 — Architecture

## Layer diagram

```
┌──────────────────────────────────────────────────────────┐
│ React UI (95% of code)                                   │
│  TitleBar / BottomBar / ControlPanel / PlaylistDrawer /  │
│  ContextMenu / ProgressBar / Converter / Cutter          │
│  Zustand store  ──  src/lib/mpv.ts (typed bridge)        │
├──────────────────────────────────────────────────────────┤
│ IPC (Tauri commands + events, all typed)                 │
├──────────────────────────────────────────────────────────┤
│ src-tauri (Rust, thin relay ONLY)                        │
│  commands.rs ──► MpvState (Mutex<libmpv handle>)         │
│  events.rs   ◄── throttled mpv property change events    │
│  ffmpeg.rs   ── spawn sidecar jobs, parse -progress      │
│  tauri-plugin-libmpv  (the mpv surface + embed)          │
├──────────────────────────────────────────────────────────┤
│ libmpv + FFmpeg (bundled native binaries per OS)         │
└──────────────────────────────────────────────────────────┘
```

Rules: nothing below the bridge may import Tauri APIs; nothing in the UI may import
Rust directly — only `invoke()` through `src/lib/mpv.ts`. The UI never touches the
plugin's raw command names; the bridge is the single choke point.

## The contract file (write this FIRST, before any feature)

`src/lib/mpv-contract.ts` defines, in TypeScript:

- `PlayerCommand` union — every command the UI can send:
  `load { path|url, append? }`, `playPause`, `stop`, `next`, `prev`,
  `seek { mode: 'absolute'|'relative', seconds, percent? }`,
  `setSpeed`, `setVolume { pct, maxPct }`, `setLoopMode`,
  `setAspect { mode }`, `setVideoProp { key: 'brightness'|'contrast'|'saturation'|'hue', value }`,
  `loadSubtitle { file, primary: boolean }`, `setSubDelay { seconds, primary }`,
  `setSubStyle { ... }`, `screenshot`, `setFullscreen(bool)`, `setAlwaysOnTop(bool)`.
- `PlayerEvent` union — every event Rust emits (all validated with zod on receipt):
  `time { pos, duration }` (throttled to 5 Hz), `state { idle|playing|paused|stopped }`,
  `mediaLoaded { title, tracks: TrackList, chapters }`, `trackSwitched`,
  `subtitleList { primary, secondary }`, `volume { pct }`, `speed { x }`,
  `seekDone { pos }`, `error { code, message }`, `ffmpegProgress { jobId, pct, etaSec }`,
  `ffmpegDone { jobId, ok, outputPath? }`.
- Shared enums: `LoopMode = 'single'|'order'|'loop'|'singleLoop'|'random'`,
  `AspectMode = 'default'|'4:3'|'16:9'|'fill'`.

Both sides code against this file. When the contract changes, change the file first,
then both sides.

## Rust side (`src-tauri/src/`)

- `main.rs` — plugin registration, single-instance plugin, window setup. Nothing else.
- `commands.rs` — one `#[tauri::command]` per PlayerCommand; each is ≤10 lines:
  lock state → call plugin/mpv → return `Result<(), String>`.
- `events.rs` — a background thread polls mpv events (`mpv_wait_event`), maps
  `MPV_EVENT_PROPERTY_CHANGE` for `time-pos`, `pause`, `track-list`, `duration` into
  `PlayerEvent` and emits with **throttling** (time-pos coalesced to 200 ms).
- `ffmpeg.rs` — `start_job(args) -> jobId`: spawn `ffmpeg` sidecar with
  `-progress pipe:2 -nostats`, parse key=value lines, emit `ffmpegProgress`;
  `cancel_job(jobId)` kills the process tree. `jobId` = UUID.
- `thumbs.rs` — async preview-thumbnail generation: `ffmpeg -ss <t> -frames:v 1 -vf
  scale=320:-2` into `{cache_dir}/thumbs/{hash}/{ms}.jpg`, bounded to 2 concurrent jobs.

## React side

- `src/lib/mpv.ts` — typed wrappers: `invoke('player_command', { cmd })`, plus
  `listenPlayerEvents(cb)` that zod-validates every payload and drops malformed ones.
- `src/store/player.ts` (Zustand) — the ONLY mutable player state: `status, positionSec,
  durationSec, volume, speed, loopMode, tracks, subtitles, panelTab, playlist, ...`.
  Components read the store; they never hold their own copies of position/volume.
- Components mirror the screenshots 1:1 — see `02-design-system.md`.

## Data-flow invariants (the bugs you avoid by obeying these)

1. UI → Rust: always a command, fire-and-forget, idempotent where possible.
2. Rust → UI: always an event through ONE channel, always zod-validated.
3. Position display: while the user drags the seek slider, **incoming `time` events are
   ignored** (drag wins); on release, send `seek` and resume listening.
4. All FFmpeg/thumbnail work is off-thread with bounded concurrency; results arrive
   as events, never as invoke return values of long calls.
