# Native libraries (libmpv + FFmpeg) — M0 bundling step

The plugin needs **two** native pieces at runtime (verified against the
`tauri-plugin-libmpv` 0.3.2 README):

1. `libmpv-wrapper` — the plugin↔libmpv interface
   ([releases](https://github.com/nini22P/libmpv-wrapper/releases)).
2. Real `libmpv` — the player core.

Plus the **FFmpeg sidecar** binary per OS (Converter/Cutter/thumbnails).

## Automatic setup (all OSes)

```sh
npm run setup:libmpv   # runs `tauri-plugin-libmpv-api setup-lib`
```

- Downloads the matching `libmpv-wrapper` into `src-tauri/lib/`.
- On **Windows** also downloads `libmpv` (zhongfly build).
  - Use the plain `mpv-dev-lgpl-*` archive, **not** the `v3` one, unless
    your CPU is known to support it.
- On **macOS / Linux** install system libmpv first (script cannot do it):

```sh
brew install mpv                        # macOS
sudo apt install libmpv-dev             # Debian/Ubuntu Linux
```

`tauri.conf.json` already bundles whatever lands in `src-tauri/lib/`
(`bundle.resources: ["lib/**/*"]`). `src-tauri/lib/` is gitignored —
fetch per machine / in CI, never commit binaries.

## Platform status (upstream, plugin README)

| OS      | Status        |
| ------- | ------------- |
| Windows | Fully tested  |
| Linux   | Experimental — window embedding is not working upstream |
| macOS   | Not tested    |

Consequence for M0 acceptance: a green Linux CI build proves compile +
bundle only. Rendering acceptance ("black mpv surface, no crash") must be
confirmed on a real Windows machine first, then macOS/Linux.

## FFmpeg sidecar (M7, noted here so it isn't forgotten)

Not wired in M0. Plan: bundle one FFmpeg binary per OS as a Tauri
sidecar, detect spawn failure once at startup (single clear error, never
per-job failures — 04-edge-cases.md §33). GPL: ship license text + source
offer in the installer (00-context-and-decisions.md).
