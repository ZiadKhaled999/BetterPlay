# QQPlayer Clone — Agent Build Handbook

This bundle is the **single source of truth** for building a cross-platform desktop media
player that reproduces the UI/UX of QQPlayer (screenshots in `./images/`), using
**Tauri 2 + React + TypeScript + libmpv**.

## Read this first (mandatory order)

| # | File | What it gives you |
|---|------|-------------------|
| 0 | `00-context-and-decisions.md` | Why this stack, what the product is, hard constraints |
| 1 | `01-architecture.md` | Layers, crates, data flow, typed command/event contracts |
| 2 | `02-design-system.md` | Color/spacing tokens + a per-screenshot visual audit |
| 3 | `03-build-order.md` | Milestones M0–M11, what's in scope, what is explicitly OUT |
| 4 | `04-edge-cases.md` | Every known hard case and the required behavior |
| 5 | `05-agent-rules.md` | Anti-hallucination rules: verify, don't assume, never do X |

## Images (reference constantly)

- `images/01-main-empty.png` — empty state + bottom control strip
- `images/02-menu.png` — right-click context menu with submenus
- `images/03-playlist.png` — playlist drawer + loop-mode menu
- `images/04-panel-playback.png` — Control Panel, Playback tab
- `images/05-panel-effects.png` — Control Panel, Effects tab
- `images/06-panel-subtitle-sync.png` — Control Panel, Subtitle Sync tab
- `images/07-preview-thumbnail.png` — hover preview thumbnail over progress bar
- `images/08-video-converter.png` — separate Video/Audio Converter window
- `images/09-video-cutter.png` — separate Video Audio Cutter window

## Ground rules (repeated from `05-agent-rules.md`)

1. **Never invent API names.** Every plugin/tauri/mpv symbol you use must be confirmed
   against real source: `cargo doc`, `grep -rn "#[tauri::command]"` inside the plugin
   crate, or the mpv manual (`mpv.io/manual/stable/`). If you cannot confirm it, write a
   `// TODO(verify):` and ask — do not guess.
2. **No `<video>` element, no video.js, no web codecs anywhere.** Video renders only
   through the embedded libmpv surface.
3. **Schema-first.** TS types for every command and event live in
   `src/lib/mpv-contract.ts` and are the contract both sides code against.
4. **One milestone at a time.** Finish M(n), pass its acceptance checklist, then start
   M(n+1). Do not skip ahead "because it's easy".
