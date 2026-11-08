import "./recording.css";
import type { Settings } from "../../state.ts";

const pause = (
  <svg viewBox="0 0 55 55" aria-hidden>
    <rect x="19.5" y="17" width="5.5" height="21" rx="1.5" />
    <rect x="30" y="17" width="5.5" height="21" rx="1.5" />
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
        <button className="recording-still" data-holding={holding || undefined} aria-label="Take Picture" />
      )}
    </>
  );
}
