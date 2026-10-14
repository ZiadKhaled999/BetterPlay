import { z } from "zod";

/**
 * M0 — schema-first contract (see 01-architecture.md).
 *
 * TS types for every command the UI may send and every event Rust may emit.
 * Both sides code against this file. Contract changes get their own commit
 * FIRST, with both sides adapted immediately after — never diverged.
 *
 * NOTE (Rule 1): mpv property names used anywhere in this handbook
 * (e.g. `secondary-sid`, `volume-max`, `video-aspect-override`) are
 * UNVERIFIED candidates. This file deliberately contains NO mpv property
 * names — only UI-level vocabulary. The mapping to real mpv properties
 * happens in the bridge/relay (M1+) and each name must be confirmed against
 * `mpv.io/manual/stable/` or the bundled binary before use.
 */

// ---------------------------------------------------------------------------
// Shared enums
// ---------------------------------------------------------------------------

export const LoopModeSchema = z.enum([
  "single",
  "order",
  "loop",
  "singleLoop",
  "random",
]);
export type LoopMode = z.infer<typeof LoopModeSchema>;

export const AspectModeSchema = z.enum(["default", "4:3", "16:9", "fill"]);
export type AspectMode = z.infer<typeof AspectModeSchema>;

// ---------------------------------------------------------------------------
// PlayerCommand — UI -> Rust (fire-and-forget, idempotent where possible)
// ---------------------------------------------------------------------------

const LoadCommandSchema = z
  .object({
    type: z.literal("load"),
    path: z.string().min(1).optional(),
    url: z.string().url().optional(),
    append: z.boolean().optional(),
  })
  .refine((c) => c.path !== undefined || c.url !== undefined, {
    message: "load requires exactly one of path | url",
  });

export const PlayerCommandSchema = z.discriminatedUnion("type", [
  LoadCommandSchema,
  z.object({ type: z.literal("playPause") }),
  z.object({ type: z.literal("stop") }),
  z.object({ type: z.literal("next") }),
  z.object({ type: z.literal("prev") }),
  z.object({
    type: z.literal("seek"),
    // Absolute seconds. Percent is NOT used (breaks on VBR files).
    mode: z.enum(["absolute", "relative"]),
    seconds: z.number().finite(),
    percent: z.number().min(0).max(100).optional(),
  }),
  z.object({ type: z.literal("setSpeed"), x: z.number().positive() }),
  z.object({
    type: z.literal("setVolume"),
    pct: z.number().min(0),
    maxPct: z.number().min(100),
  }),
  z.object({ type: z.literal("setLoopMode"), mode: LoopModeSchema }),
  z.object({ type: z.literal("setAspect"), mode: AspectModeSchema }),
  z.object({
    type: z.literal("setVideoProp"),
    key: z.enum(["brightness", "contrast", "saturation", "hue"]),
    value: z.number().min(-100).max(100),
  }),
  z.object({
    type: z.literal("loadSubtitle"),
    file: z.string().min(1),
    primary: z.boolean(),
  }),
  z.object({
    type: z.literal("setSubDelay"),
    seconds: z.number().finite(),
    primary: z.boolean(),
  }),
  z.object({
    type: z.literal("setSubStyle"),
    fontFamily: z.string().optional(),
    size: z.number().positive().optional(),
    color: z.string().optional(),
    borderSize: z.number().min(0).optional(),
    // Position presets are pinned in M5; free string until then.
    position: z.string().optional(),
  }),
  z.object({ type: z.literal("screenshot") }),
  z.object({ type: z.literal("setFullscreen"), enabled: z.boolean() }),
  z.object({ type: z.literal("setAlwaysOnTop"), enabled: z.boolean() }),
]);
export type PlayerCommand = z.infer<typeof PlayerCommandSchema>;

// ---------------------------------------------------------------------------
// PlayerEvent — Rust -> UI (ONE channel, always zod-validated on receipt)
// ---------------------------------------------------------------------------

export const PlaybackStatusSchema = z.enum([
  "idle",
  "playing",
  "paused",
  "stopped",
]);
export type PlaybackStatus = z.infer<typeof PlaybackStatusSchema>;

const TrackSchema = z.object({
  id: z.number().int(),
  kind: z.enum(["audio", "video", "sub"]),
  lang: z.string().optional(),
  title: z.string().optional(),
  codec: z.string().optional(),
});
export type Track = z.infer<typeof TrackSchema>;

const ChapterSchema = z.object({
  start: z.number().min(0),
  end: z.number().min(0).optional(),
  title: z.string().optional(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

const SubTrackSchema = z.object({
  id: z.number().int(),
  lang: z.string().optional(),
  title: z.string().optional(),
  externalFile: z.string().optional(),
});

export const PlayerEventSchema = z.discriminatedUnion("type", [
  // Throttled to 5 Hz by the relay. Ignored while the user drags seek.
  z.object({
    type: z.literal("time"),
    pos: z.number().min(0).nullable(),
    duration: z.number().min(0).nullable(),
  }),
  z.object({ type: z.literal("state"), status: PlaybackStatusSchema }),
  z.object({
    type: z.literal("mediaLoaded"),
    title: z.string(),
    tracks: z.array(TrackSchema),
    chapters: z.array(ChapterSchema),
  }),
  z.object({
    type: z.literal("trackSwitched"),
    kind: z.enum(["audio", "sub"]),
    id: z.number().int(),
  }),
  z.object({
    type: z.literal("subtitleList"),
    primary: SubTrackSchema.nullable(),
    secondary: SubTrackSchema.nullable(),
  }),
  z.object({ type: z.literal("volume"), pct: z.number().min(0) }),
  z.object({ type: z.literal("speed"), x: z.number().positive() }),
  z.object({ type: z.literal("seekDone"), pos: z.number().min(0) }),
  z.object({
    type: z.literal("error"),
    code: z.string(),
    message: z.string(),
  }),
  z.object({
    type: z.literal("ffmpegProgress"),
    jobId: z.string().uuid(),
    pct: z.number().min(0).max(100).nullable(),
    etaSec: z.number().min(0).nullable(),
  }),
  z.object({
    type: z.literal("ffmpegDone"),
    jobId: z.string().uuid(),
    ok: z.boolean(),
    outputPath: z.string().optional(),
  }),
]);
export type PlayerEvent = z.infer<typeof PlayerEventSchema>;
