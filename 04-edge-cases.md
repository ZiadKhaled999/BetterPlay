# 04 — Edge Cases & Required Behavior

Every item here is a requirement, not a suggestion. When implementing anything that
touches one of these areas, handle the case in the same change — do not defer.

## Media / playback

1. **Hardware decode fallback.** `hwdec=auto-safe` can still fail (driver bug, odd
   codec). If `hwdec-current` reports `none` for a file that should hw-decode, log it
   and continue software decode — never crash, never show an error dialog for this.
2. **Seek while paused.** After `seek`, force a frame redraw so the UI doesn't show a
   stale frame (mpv needs an explicit wake — check the render API's report-render-
   params/redraw semantics; verify, don't guess).
3. **Seek granularity.** Use absolute seconds, not percent — percent breaks on
   VBR files. Clamp seeks to `[0, duration]`; ignore seeks before `duration` is known.
4. **Drag vs. events.** While the seek slider is dragged, ignore incoming `time`
   events; on mouse-up send ONE seek; then resync. Without this the slider fights the
   user (classic bug — see `01-architecture.md` invariant 3).
5. **Very short files / streams.** Duration may be 0 or unknown (live streams, some
   MKVs). UI must show `--:--`, disable seek and loop-single, keep play/pause working.
6. **Speed changes.** Cap at mpv limits; if audio pitch shifts are unwanted set
   `audio-pitch-correction` appropriately (verify property name). Reset speed on new
   file? NO — QQPlayer keeps speed per session; keep it.
7. **Volume > 100%.** Requires `volume-max=1000` (for the 10x steps in image 04);
   boost is software and can distort — that's expected, no warning needed.
8. **Loop semantics** (verify exact mpv flags in the manual before implementing):
   - Single: stop after this file (`loop-file=no`, `loop-playlist=no`, stop at end).
   - Order: play all once, stop at list end.
   - Loop: repeat whole list (`loop-playlist=inf`).
   - Single Loop: `loop-file=inf`.
   - Random: shuffle order without restarting the current file mid-play.
9. **Multiple audio/subtitle tracks.** Populate from `track-list` event; switching
   audio must not reset subtitle delay; default select first audio + first sub with
   a language matching system locale if marked.
10. **External subtitles.** Auto-load same-basename `.srt/.ass/.ssa/.vtt` from the
    video's directory. Encoding: set `sub-codepage` fallback (e.g. `utf-8:gb18030`
    is common for CN content — make it a setting, default `auto`).
11. **Non-ASCII & weird paths.** Test paths containing CJK, emoji, spaces, `#`, `%`,
    `&`, and Windows UNC (`\\server\share`). Use Tauri's path APIs, never string
    concat. URLs passed to mpv must be fully percent-encoded.
12. **Files that change on disk** while loaded: ignore; mpv handles EOF. Do not watch.
13. **Corrupt / unsupported file.** mpv fires an error event → show a small toast in
    the UI (not a native dialog), skip to next playlist item after 2s.
14. **Screenshots.** Use mpv's screenshot command so subtitles are included; filename
    pattern `{media-title}-{time}.png` in the configured directory; never overwrite
    (append counter).
15. **Sleep/hibernate during playback.** On resume, mpv may be in a bad A/V state;
    if the event stream stalls >5s while status=playing, offer "reload file at last
    position" toast.

## Windowing / lifecycle

16. **Single instance.** Second launch: focus existing window and pass argv files via
    the single-instance plugin's callback → load into playlist.
17. **Clean exit.** Closing the window must destroy the mpv render context, join the
    event thread, and kill any running ffmpeg jobs after confirmation. No zombies —
    test with `ps`/`Task Manager` after every exit path (main window, tray, Cmd+Q,
    Alt+F4, taskbar close).
18. **Fullscreen transitions** on all 3 OS; macOS uses the native fullscreen API via
    Tauri — verify; don't fake it with borderless windows on macOS.
19. **Minimal mode (Shift+Enter).** Video + 3px progress only; any key/mouse restores.
20. **Multi-monitor.** Moving the window across monitors with different DPI must not
    stretch the video surface (mpv render context handles resize — verify on DPR
    change, not just resize).
21. **Converter/Cutter windows.** Independent webviews sharing backend state via
    events; closing main window closes them; a running ffmpeg job in a closed window
    keeps running silently with a completion notification — never silently die.
22. **Window state persistence.** Restore size/position/maximized per OS; clamp to
    visible screen area (a monitor removed since last run must not strand the window).

## IPC / concurrency

23. **Event flooding.** `time-pos` fires per frame — coalesce to 200 ms before
    emitting. Same for ffmpeg `-progress` (parse every line, emit at most 4 Hz).
    Unthrottled events WILL freeze the webview on 4K/120fps files.
24. **Command ordering.** UI can send seeks faster than mpv processes them; mpv
    queues commands so this is safe, but volume sliders must debounce (send on
    change-end or ≤10 Hz).
25. **Zod-validate every event payload** in `src/lib/mpv.ts`. Malformed → drop + log.
    Never let a bad payload throw inside React render.
26. **Deadlocks.** The mpv event thread must never hold the state lock while emitting
    a Tauri event (reentrancy). Lock → copy data → unlock → emit.
27. **Long operations.** Never a `#[tauri::command]` that waits on ffmpeg. Always:
    spawn → return jobId → progress via events.

## ffmpeg jobs (Converter/Cutter/thumbnails)

28. **Progress parsing.** Use `-progress pipe:2 -nostats`; parse `out_time_ms` /
    `total_size` lines; if `duration` is unknown, show indeterminate bar.
29. **Atomic output.** Write to `output.mp4.part`, rename on success. On cancel/error,
    delete the partial. Never leave `.part` files behind (clean on startup too).
30. **Overwrite.** If target exists: show confirm in UI; ffmpeg never gets `-y`
    blindly.
31. **Same in/out path.** Refuse with a clear error before spawning (classic
    data-loss foot-gun).
32. **Concurrency cap.** Max 2 ffmpeg jobs (user-facing) / 2 thumbnail jobs; queue
    the rest.
33. **ffmpeg missing/corrupt.** Detect at startup (bundle it); if the bundled binary
    fails to spawn, show one clear error — never per-job failures.

## Filesystem / persistence

34. **Settings file corrupt** → back up to `settings.json.bak`, start with defaults,
    toast the user once.
35. **Thumbnail cache** in OS cache dir, capped (e.g. 500 MB) with LRU eviction at
    startup.
36. **Playlist file** stores absolute paths; on load, missing files show grayed with
    "missing" badge and are skipped, not deleted.

## Final acceptance checklist (run on real machines, all 3 OS)

- [ ] Open via file dialog, drag-drop, double-click file association, CLI arg
- [ ] MKV with 3 audio + 5 sub tracks, ASS styled subs, dual subs on screen
- [ ] 4K HEVC 10-bit hw-decoded; 8K file doesn't OOM (cache caps on)
- [ ] Seek 50× rapidly while paused — no stale frames, no drift
- [ ] Fullscreen ↔ minimal ↔ normal transitions, monitor switch mid-playback
- [ ] Playlist loop modes each behave exactly per §8
- [ ] Convert 3 files, cancel one mid-way, no `.part` remains
- [ ] Cut + save with copy mode and with re-encode
- [ ] Hover-thumbnail on a 2-hour file stays responsive
- [ ] Exit during playback / during conversion / during thumbnail gen — no orphans
- [ ] CJK + emoji + UNC paths open, subs auto-load, screenshots save
- [ ] Unplug headphones mid-playback — output switches, no crash (mpv handles; verify)
