# 02 — Design System & Visual Audit

Global look: **flat, pure-dark, minimal chrome.** QQPlayer is essentially black UI with
one blue accent. No gradients on controls, no rounded cards, no shadows. Everything in
this file is measured/estimated from the screenshots — when in doubt, open the image.

## Design tokens

```
color-bg-window      #000000   (video area, window background)
color-bg-bar         #000000   (title bar, bottom strip)
color-bg-panel       #2F2F2F   (control panel, context menu, drawer)
color-bg-panel-hover #3A3A3A   (menu item hover base)
color-accent         #1A9BFF   (selected tab, slider fill, play button ring,
                                radio dot, primary buttons, focus)
color-accent-soft    rgba(26,155,255,.18)  (hover wash on accent items)
color-track-empty    #4D4D4D   (unfilled slider track)
color-text-primary   #FFFFFF
color-text-secondary #9A9A9A   (timestamps on thumbnails, hints, off radios)
color-border-subtle  #1A1A1A
color-danger         #E81123   (window close hover — OS native on win/mac)
font-family          system-ui stack ("Segoe UI", Roboto, "Helvetica Neue")
font-mono            tabular-nums via font-variant-numeric (time displays)
radius               0 everywhere (square corners) except slider handles & radio
                     dots which are circular; primary buttons square.
titlebar-height      32px
bottombar-height     48px
panel-width          460px (from screenshot ratio ~ 460px at 1150px window)
slider-height        4px track, 12px circular handle, accent fill left of handle
z-order              video < panel/drawer < context menu < tool windows
```

Icons: thin-line, 1.5px stroke, white glyphs, ~16px (title bar) / ~18px (bottom bar).
Use `lucide-react` and restroke to match; do NOT use filled icon sets.

## Screenshot audit

### `images/01-main-empty.png` — empty state
- Full black window. Centered vertically at ~45% height: a glowing blue 3D penguin
  mascot logo (~120px) sitting on a soft elliptical blue light pool (radial gradient
  fading to black — the ONLY gradient allowed in the app, splash only).
- Below it: an "Open File" pill button — dark translucent fill (`rgba(255,255,255,.06)`),
  thin white outline, folder icon + label, with a small dropdown chevron on the right
  (offering File / Folder / URL).
- Title bar: "QQPlayer ⌄" left (white, 12px, chevron = the app menu), centered filename
  placeholder (dim), right cluster: pin icon (always-on-top), minimize, maximize,
  close — white line icons on black, close turns red on hover.
- Bottom strip: `00:00:00 / 00:00:00` bottom-left in small mono white text; transport
  cluster centered: square STOP, PREV (bar+triangle), PLAY (circle outline, blue ring,
  filled blue triangle), NEXT, VOLUME (speaker + slider hidden until hover); right
  cluster: screenshot icon, playlist icon, fullscreen icon — all dim white until hover.
- During playback the empty state and its gradient disappear entirely.

### `images/02-menu.png` — context menu
- Right-click over video opens a 230px-wide vertical menu at cursor, bg `#2F2F2F`,
  no border, no shadow (or a very subtle one).
- Item: label left, shortcut right-aligned in dim gray (`Ctrl + O`), 13px, height 30px,
  padding 0 16px. Hover: item fills with accent `#1A9BFF`, label turns white.
- Items with submenus (Play Mode ▸, Sound ▸, Subtitles ▸) show a right chevron; submenu
  flies out to the right, same styling, and the parent item gets a dark-gray hover
  instead of blue while its submenu is open (see "Subtitles" in the shot).
- Active state: a small white ✓ before the label (see "Normal Screen").
- Separators: 1px `#1A1A1A` full-bleed lines, 8px vertical gaps around groups.

### `images/03-playlist.png` — playlist drawer
- Slides in from the right OVER the video, width ~300px, bg `#2F2F2F`, no animation
  beyond a 150ms slide.
- Header row of small icon buttons (list sort, +, remove) top-right.
- Each item: 16:9 thumbnail (~120px wide) with duration badge bottom-right of the
  thumb (black pill, white 10px mono text), filename to the right in 12px white,
  truncated with ellipsis; active item has a 2px accent left border.
- The play-mode button in the title bar opens a floating menu (Single / Order / Loop /
  Single Loop / Random) — same menu styling as the context menu, checkmark on active.

### `images/04-panel-playback.png` — Control Panel, Playback tab
- Panel anchored right, vertically centered-ish, width ~460px, bg `#2F2F2F`.
- LEFT rail (120px): vertical tab list — Playback / Effects / Subtitle Sync /
  Subtitle style; active tab bg accent `#1A9BFF`, white text; inactive 12px `#9A9A9A`.
- RIGHT area (340px): sections stacked with 24px gaps; section titles 12px bold white,
  uppercase tracking slight.
- Radios: 14px circle outline `#4D4D4D`, accent dot when checked, labels 12px.
- Volume slider: full-width, blue fill to handle, and a row of mute/step labels
  (Mute 1x 4x 7x 10x) under it in dim 10px text.
- "Reset" bottom-right of the panel, 11px dim gray with a circular-arrow icon.

### `images/05-panel-effects.png` — Effects tab
- "Aspect Ratio": radio row (Default / 4:3 / 16:9 / Fill).
- "Color": four sliders stacked at 28px pitch — labels left (brightness, saturation,
  contrast, hue — lowercase), 200px track to the right, accent fill, small round
  handle. Range −100..100, default 0.
- Below: three 80×54 preset swatches side by side — actual tiny gradient previews of
  the color effect (Default = blue→purple diagonal, Bright = cyan shift, Soft = muted).
  Labels under swatches 10px dim. Selected swatch gets a 1px accent outline.
  (Implementation: pre-render 3 tiny WebGL/CSS-filter preview images; do NOT generate
  at runtime.)

### `images/06-panel-subtitle-sync.png` — Subtitle Sync tab
- "Primary Subtitle": full-width dark dropdown (`#1F1F1F` field, `#4D4D4D` chevron,
  placeholder "No subtitle chosen") + "Load" button (outline button, 12px).
- "Synchronization": row of [Default dropdown] [−] [0 s] [+] — minus/plus are square
  outline buttons 28×28, accent on hover; the seconds readout is a small centered mono
  field that also accepts typed numbers.
- "Secondary Subtitle" block repeats below. "Reset" bottom-right.

### `images/07-preview-thumbnail.png` — progress bar hover preview
- Progress bar: 3px accent line at the very bottom of the video area (above the bottom
  strip), gray `#4D4D4D` for the unplayed remainder and for the buffered region.
- On hover: a 160×90 thumbnail floats with its bottom edge ~16px above the bar,
  horizontally centered on the cursor, clipped to window edges; a black pill below the
  thumb shows `00:02:12` in white mono 10px.
- The played portion keeps accent; the drag handle appears only while scrubbing.

### `images/08-video-converter.png` — Converter window
- SEPARATE native window (own title bar "Video/Audio Converter", min/close only).
- "+ Add Files" dashed-outline button top-left; table below with column headers
  (Name, Compression Ratio, Progress, Remaining) in 12px dim caps; rows fill with
  per-file progress bars (accent fill).
- Bottom settings band: grouped labeled selects — Format (视频/mp4), Video group
  (Codec H264, Bitrate 512 Kbps, Fps 24 fps, Size 720×480 with a lock icon between
  W/H fields), Audio group (Codec AAC, Bitrate 64 Kbps). Fields are 120px-wide dark
  dropdowns, 12px labels dim above-left.
- Footer: "Auto Shutdown" checkbox, output path field + Select button, **Start** —
  solid accent square button, white label — and **Stop** — gray `#4D4D4D` button.

### `images/09-video-cutter.png` — Cutter window
- Separate window, "Video Audio Cutter". Preview player top (the mpv surface reused).
- Under it: a round play button + `00:00:25` readout left; right side "Preview Speed"
  with 1.0X / 2.0X toggle (segmented, accent on active).
- Trim track: thin gray full-width line; two circular accent handles (12px) at start
  and end positions; timestamps in mono below each handle; the segment between handles
  shows a 3px accent line, outside is gray.
- Bottom form row 1: Filename field, format select (压缩视频), **Save** accent button
  with dropdown chevron (Save / Save As).
- Bottom form row 2: Resolution (1280 W 🔒 720 H — lock maintains aspect), Format MP4,
  Quality (高 dropdown), and a dim readout of estimated output size
  (压缩比 8.46MB/30.52MB).

## Layout skeleton (all windows)

```
┌─ 32px title bar ───────────────────────────────────┐
│ QQPlayer ⌄        filename              📌  –  □  ✕ │
├─ video area (mpv surface, black letterbox) ────────┤
│                 (panels/drawers/menus float here)   │
├─ 3px progress bar ─────────────────────────────────┤
├─ 48px bottom strip ────────────────────────────────┤
│ time   ⏹ ⏮ ▶ ⏭ 🔊           📷 ☰ ⛶              │
└────────────────────────────────────────────────────┘
```

Window min size 720×480. Resize: video area flexes; bars fixed height. In fullscreen,
title bar + bottom strip auto-hide, reveal on mouse-move to bottom/top edge (250ms).
