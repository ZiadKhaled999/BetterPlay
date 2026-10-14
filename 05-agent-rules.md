# 05 — Agent Rules (Anti-Hallucination Protocol)

You (the coding agent) are the biggest risk in this project — not the tech. These
rules exist because LLMs confidently invent APIs, misremember property names, and
"helpfully" build things that were explicitly out of scope. Follow them literally.

## Rule 1 — Verify every external symbol against source. Never recall from memory.

Before using ANY symbol from tauri, tauri-plugin-libmpv, mpv, or ffmpeg:

- Rust crates: run `cargo doc -p <crate> --no-deps` and read it, or
  `grep -rn "#[tauri::command]" ~/.cargo/registry/src/*/tauri-plugin-libmpv-*/`
  to enumerate the plugin's ACTUAL command names and payloads.
- mpv properties/commands: check `https://mpv.io/manual/stable/` (or the bundled
  mpv binary's `--list-properties` / send `get_property` with `help`). Property names
  used in this handbook (e.g. `secondary-sid`, `secondary-sub-delay`, `volume-max`,
  `sub-codepage`, `video-aspect-override`, `audio-pitch-correction`) are CANDIDATES —
  confirm each before use. Many have changed names across mpv versions; we pin one.
- ffmpeg flags: verify against `ffmpeg -h full` output from the EXACT bundled binary.

If you cannot verify a symbol, leave `// TODO(verify): <what you need>` and a stub —
a missing feature is recoverable; a hallucinated API is a silent bug that ships.

## Rule 2 — Scope discipline

- Work strictly on the current milestone from `03-build-order.md`. Its "DO NOT" list
  is absolute. "While I'm here I also…" = a revert.
- Never add features not visible in `images/` or listed in `00-context-and-decisions.md`.
  No themes, no plugins system, no DLNA, no chapter UI, no hardware-encode in v1.
- No `<video>`, no video.js, no MSE/webcodecs — ever. Video is the libmpv surface.

## Rule 3 — One-way data flow, schema-first

- All commands/events go through `src/lib/mpv.ts` + `mpv-contract.ts`. If you find
  yourself typing `invoke("` anywhere else, stop and route through the bridge.
- Every event payload is zod-parsed; every invalid payload is dropped and logged —
  no exceptions in render paths.
- UI state lives in the Zustand store only. Components never duplicate player state.

## Rule 4 — Edge cases are part of the feature, not follow-ups

Before marking any task done, read `04-edge-cases.md` and handle every item that
touches your change in the same commit. If one genuinely doesn't apply, write why in
the commit message.

## Rule 5 — Test like a QA engineer, not like a demo

- Acceptance checklists in `03-build-order.md` are executed, not eyeballed.
- Every exit path is checked for orphaned processes (Rule: §17 of edge cases).
- Seek-drag fight, event flooding, non-ASCII paths, corrupt settings, missing files —
  these get explicit manual tests, because they're the top-6 real-world bugs.
- GUI cannot run in this dev environment: verify compile + headless logic here;
  UI acceptance happens on CI-built binaries on real machines. State clearly in your
  summary what was verified headless vs. what needs real-machine testing. Never write
  "tested" for something you only compiled.

## Rule 6 — Don't touch what works

- Never modify the plugin's source. Wrap it.
- Never "clean up" or refactor code from a completed milestone unless a bug requires it.
- Never upgrade tauri/plugin/libmpv versions mid-milestone. Upgrades are their own
  milestone with full regression.

## Rule 7 — Commit discipline

- One logical change per commit; message states what + which milestone + which edge
  cases were handled.
- Contract changes (`mpv-contract.ts`) are their own commit, first, with both sides
  adapted immediately after — never leave the contract and implementations diverged.

## Definition of done for the whole project

All milestones M0–M10 accepted, the Final checklist in `04-edge-cases.md` fully
checked on Windows, macOS, and Linux binaries built by CI. Anything less is not done.
