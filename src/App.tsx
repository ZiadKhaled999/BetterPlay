import { useEffect, useState } from "react";
import { initPlayer } from "./lib/mpv";

/**
 * M0 — black mpv surface only. NO chrome, NO panels, NO menus
 * (those are M2+). Proves the plugin surface embeds without crashing.
 */
export default function App() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initPlayer().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      data-testid="mpv-surface"
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
      }}
    >
      {error !== null && (
        <div
          role="alert"
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            color: "#fff",
            background: "rgba(232,17,35,.9)",
            padding: "8px 12px",
            fontSize: 12,
          }}
        >
          mpv init failed: {error}
        </div>
      )}
    </div>
  );
}
