import { create } from "zustand";
import type { PlaybackStatus } from "../lib/mpv-contract";

/**
 * M0 — the ONLY mutable player state (see 01-architecture.md).
 * Components read this store; they never hold their own copies of
 * position/volume. Fields arrive per milestone (M1 fills playback core).
 */
interface PlayerState {
  status: PlaybackStatus;
  positionSec: number | null;
  durationSec: number | null;
  setStatus: (status: PlaybackStatus) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  status: "idle",
  positionSec: null,
  durationSec: null,
  setStatus: (status) => set({ status }),
}));
