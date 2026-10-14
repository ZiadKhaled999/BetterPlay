import { init } from "tauri-plugin-libmpv-api";
import type { MpvConfig } from "tauri-plugin-libmpv-api";

/**
 * M0 — typed bridge (single choke point, see 01-architecture.md).
 *
 * NOTHING below this module may import Tauri APIs; NOTHING in the UI may
 * invoke the player except through here. Full command wrappers
 * (`player_command` invoke + `listenPlayerEvents` with zod validation)
 * arrive in M1 with the Rust relay. This module currently owns mpv
 * surface init only — enough for the M0 black-surface acceptance check.
 */

// Initial options verified against the plugin README quick-start
// (tauri-plugin-libmpv 0.3.2). Do NOT add mpv options from memory —
// every further option must be confirmed in mpv.io/manual/stable/ first.
const MPV_CONFIG: MpvConfig = {
  initialOptions: {
    vo: "gpu-next",
    hwdec: "auto-safe",
    "keep-open": "yes",
    "force-window": "yes",
  },
  observedProperties: [
    ["pause", "flag"],
    ["time-pos", "double", "none"],
    ["duration", "double", "none"],
  ],
};

let initPromise: Promise<string> | null = null;

/** Idempotent: StrictMode double-mounts in dev; init exactly once. */
export function initPlayer(): Promise<string> {
  if (!initPromise) {
    initPromise = init(MPV_CONFIG);
  }
  return initPromise;
}
