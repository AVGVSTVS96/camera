import { useEffect, useRef, useState, type RefObject } from "react";
import "./recording.css";
import type { Settings } from "../../state.ts";

const pause = (
  <svg viewBox="0 0 55 55" aria-hidden>
    <rect x="21.2" y="18.85" width="5" height="17.3" rx="1.2" />
    <rect x="28.8" y="18.85" width="5" height="17.3" rx="1.2" />
  </svg>
);

const resume = (
  <svg viewBox="0 0 55 55" aria-hidden>
    <circle cx="27.5" cy="27.5" r="10" fill="var(--record)" />
  </svg>
);

const lock = (
  <svg viewBox="0 0 11.4 16.3" width="11.4" height="16.3" aria-hidden>
    <path d="M2.13 7V4.3a3.57 3.57 0 0 1 7.14 0V7" fill="none" stroke="currentColor" stroke-width="1.45" />
    <rect y="6.6" width="11.4" height="9.7" rx="2" fill="currentColor" />
  </svg>
);

const two = (n: number) => String(n).padStart(2, "0");

function useElapsed(running: boolean) {
  const [ms, setMs] = useState(0);
  const total = useRef(0);

  useEffect(() => {
    if (!running) return;

    const from = Date.now() - total.current;
    const tick = setInterval(() => setMs((total.current = Date.now() - from)), 100);

    return () => {
      clearInterval(tick);
      setMs((total.current = Date.now() - from));
    };
  }, [running]);

  useEffect(() => {
    if (running) document.documentElement.style.setProperty("--elapsed", String(ms / 1000));
  }, [running, ms]);

  const s = Math.floor(ms / 1000);

  return `${two(Math.floor(s / 3600))}:${two(Math.floor(s / 60) % 60)}:${two(s % 60)}`;
}

interface RecordingProps {
  settings: Settings;
  lockRef: RefObject<HTMLButtonElement | null>;
  still: boolean;
  onPause: () => void;
  onStill: () => void;
}

export function Recording({ settings, lockRef, still, onPause, onStill }: RecordingProps) {
  const { mode, holding, recording, paused } = settings;
  const elapsed = useElapsed(!still && !paused);
  const stills = mode === "video" || mode === "slo-mo";

  return (
    <>
      <span className="recording-home" />
      {mode !== "time-lapse" && <time className="recording-timer">{elapsed}</time>}
      {recording && mode === "video" && (
        <button
          className="recording-pause"
          aria-label={paused ? "Resume Recording" : "Pause Recording"}
          onClick={onPause}
        >
          {paused ? resume : pause}
        </button>
      )}
      {(holding || (recording && stills)) && (
        <button
          ref={lockRef}
          className="recording-still"
          data-holding={holding || undefined}
          aria-label="Take Picture"
          onClick={onStill}
        >
          {holding && lock}
        </button>
      )}
    </>
  );
}
