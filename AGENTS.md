# AGENTS.md — QQPlayer Clone (Tauri 2 + React + TS + libmpv)

> Greenfield: this repo is currently handbook + screenshots only — no `src/`, no `src-tauri/`, no CI yet. Start at M0 (`03-build-order.md`).

## Read first (in order)

1. `README.md` → `00-context-and-decisions.md` → `01-architecture.md`
2. `02-design-system.md` + `images/` (reference constantly while doing UI)
3. `03-build-order.md` (current milestone only) + `04-edge-cases.md` (items touching your change) + `05-agent-rules.md`

Screenshot files `images/01–09` are the spec. No themes, plugins, DLNA, chapter UI, hardware-encode flags in v1.

## Hard rules (from `05-agent-rules.md` — do not soften)

- **Never invent API names.** Verify every tauri / `tauri-plugin-libmpv` / mpv / ffmpeg symbol against source (`cargo doc -p <crate>`, `grep -rn "#\[tauri::command\]"` in the plugin crate, `mpv.io/manual/stable/` or bundled binary `--list-properties`, `ffmpeg -h full` from the bundled binary). Property names in these docs (`secondary-sid`, `volume-max`, `video-aspect-override`, etc.) are UNVERIFIED candidates. If unverifiable, leave `// TODO(verify):` stub — never guess.
- **No `<video>`, video.js, MSE/webcodecs — ever.** Video renders only through the libmpv surface.
- **Schema-first:** `src/lib/mpv-contract.ts` (to be created in M0) is the contract both sides code against. Contract change = own commit first, both sides adapted immediately after, never diverged.
- **One milestone at a time** per `03-build-order.md`. Its DO-NOT list is absolute.
- **Don't touch what works:** never modify plugin source (wrap it), never refactor completed milestones, never upgrade tauri/plugin/libmpv mid-milestone.

## Architecture invariants (see `01-architecture.md`)

- Layers: React UI (95%) → typed IPC → thin Rust relay (`commands.rs` ≤10 lines/cmd, `events.rs`, `ffmpeg.rs`, `thumbs.rs`) → libmpv + FFmpeg sidecar.
- All `invoke()` goes through `src/lib/mpv.ts` (single choke point); UI never imports Rust/plugin symbols directly; nothing below the bridge imports Tauri APIs.
- Rust→UI is events on ONE channel, every payload zod-validated in `mpv.ts`, malformed → drop + log, never throw in render.
- Player state lives ONLY in `src/store/player.ts` (Zustand); components hold no copies of position/volume.
- `time` events throttled to 5 Hz / 200 ms coalesce; ffmpeg progress ≤4 Hz; volume sliders debounced (change-end or ≤10 Hz). Unthrottled events freeze the webview.
- Seek: absolute seconds clamped to `[0, duration]`, ignore before duration known; while dragging the slider ignore incoming `time` events, send ONE seek on release.
- FFmpeg/thumbnails never block: `spawn → return jobId → progress via events`; max 2 concurrent jobs each; write to `.part`, rename on success, delete on cancel/error; never pass `-y` blindly; refuse same in/out path.
- mpv event thread: lock → copy → unlock → emit (never hold lock while emitting).

## Constraints & gotchas

- Offline-only (except user-provided URLs), no telemetry, no auto-update in v1. Single instance: second launch focuses + passes argv files. Ship GPL license text + source offer (libmpv/FFmpeg).
- Volume >100% needs `volume-max` (verify); speed persists per session; loop modes map to exact mpv flags — verify in manual before coding.
- External subs: auto-load same-basename `.srt/.ass/.ssa/.vtt`; non-UTF-8 via `sub-codepage` (verify). Use Tauri path APIs, never string concat; test CJK/emoji/spaces/`# % &`/UNC paths.
- Corrupt file → UI toast (not native dialog), skip to next after 2s. Settings corrupt → backup to `.bak`, defaults + one toast. Playlist stores absolute paths; missing files grayed + skipped, not deleted.
- Window: min 720×480; macOS fullscreen via native Tauri API (verify); minimal mode = video + 3px bar; clamp restored geometry to visible screens. Closing main window closes Converter/Cutter; running ffmpeg job in a closed window keeps running + notifies on completion.
- Design: flat pure-dark, tokens + layout skeleton in `02-design-system.md`; `lucide-react` thin-line icons only; the ONLY gradient is the splash mascot glow.

## Verification (headless here, GUI on CI machines)

- Dev containers cannot show GUI: verify `cargo build` / `npm run tauri build` + headless logic here; UI acceptance needs CI matrix binaries (win/mac/linux) on real machines. State headless-vs-real-machine clearly; never write "tested" for compile-only.
- Every exit path checked for orphaned mpv/ffmpeg processes; final gate is `04-edge-cases.md` §Final checklist on all 3 OSes.
