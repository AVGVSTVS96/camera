import "./recording.css";
import type { Settings } from "../../state.ts";

const pause = (
  <svg viewBox="0 0 55 55" aria-hidden>
    <rect x="19.5" y="17" width="5.5" height="21" rx="1.5" />
    <rect x="30" y="17" width="5.5" height="21" rx="1.5" />
  </svg>
);

const lock = (
  <svg viewBox="0 0 12 17" width="12" height="17" fill="currentColor" aria-hidden>
    <path d="M2.8 7V4.9a3.2 3.2 0 0 1 6.4 0V7h.3A2.5 2.5 0 0 1 12 9.5v5A2.5 2.5 0 0 1 9.5 17h-7A2.5 2.5 0 0 1 0 14.5v-5A2.5 2.5 0 0 1 2.5 7zm1.6 0h3.2V4.9a1.6 1.6 0 0 0-3.2 0z" />
  </svg>
);

export function Recording({ settings }: { settings: Settings }) {
  const { mode, holding, recording } = settings;
  const stills = mode === "video" || mode === "slo-mo";

  return (
    <>
      <time className="recording-timer">00:00:00</time>
      {recording && mode === "video" && (
        <button className="recording-pause" aria-label="Pause Recording">
          {pause}
        </button>
      )}
      {(holding || (recording && stills)) && (
        <button className="recording-still" data-holding={holding || undefined} aria-label="Take Picture">
          {holding && lock}
        </button>
      )}
    </>
  );
}
