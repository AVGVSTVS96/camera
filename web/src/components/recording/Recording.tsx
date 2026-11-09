import type { RefObject } from "react";
import "./recording.css";
import type { Settings } from "../../state.ts";

const pause = (
  <svg viewBox="0 0 55 55" aria-hidden>
    <rect x="21.2" y="18.85" width="5" height="17.3" rx="1.2" />
    <rect x="28.8" y="18.85" width="5" height="17.3" rx="1.2" />
  </svg>
);

const lock = (
  <svg viewBox="0 0 11.4 16.3" width="11.4" height="16.3" aria-hidden>
    <path d="M2.13 7V4.3a3.57 3.57 0 0 1 7.14 0V7" fill="none" stroke="currentColor" stroke-width="1.45" />
    <rect y="6.6" width="11.4" height="9.7" rx="2" fill="currentColor" />
  </svg>
);

export function Recording({ settings, lockRef }: { settings: Settings; lockRef: RefObject<HTMLButtonElement | null> }) {
  const { mode, holding, recording } = settings;
  const stills = mode === "video" || mode === "slo-mo";

  return (
    <>
      {mode !== "time-lapse" && <time className="recording-timer">00:00:00</time>}
      {recording && mode === "video" && (
        <button className="recording-pause" aria-label="Pause Recording">
          {pause}
        </button>
      )}
      {(holding || (recording && stills)) && (
        <button ref={lockRef} className="recording-still" data-holding={holding || undefined} aria-label="Take Picture">
          {holding && lock}
        </button>
      )}
    </>
  );
}
