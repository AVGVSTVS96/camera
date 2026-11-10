import { useEffect, useRef, useState } from "react";
import type { Hint, Panorama } from "../../pano.ts";
import type { Props } from "../../state.ts";
import "./pano.css";

const words = {
  "too fast": "Slow Down",
  "move up": "Move Up",
  "move down": "Move Down",
};

export function Pano({ settings, update, pan }: Props & { pan?: Panorama }) {
  const root = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState<Hint>();
  const { panning, reverse } = settings;

  useEffect(() => {
    const el = root.current;

    if (!pan || !el) return;

    el.querySelector(".pano-frame")?.append(pan.strip);

    let frame = requestAnimationFrame(function tick() {
      el.style.setProperty("--at", String(pan.progress()));
      el.style.setProperty("--drift", String(pan.drift()));
      setHint(pan.hint());
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
      pan.strip.remove();
      el.style.removeProperty("--at");
      el.style.removeProperty("--drift");
      setHint(undefined);
    };
  }, [pan]);

  return (
    <div
      className="pano"
      ref={root}
      data-panning={panning || undefined}
      data-reverse={reverse || undefined}
      data-warn={(panning && hint) || undefined}
    >
      <p className="pano-text">
        {panning
          ? ((hint && words[hint]) ?? "Keep the arrow on the center line.")
          : "Move iPhone continuously when taking a Panorama."}
      </p>
      <div className="pano-frame" />
      <i className="pano-line" />
      <button
        className="pano-arrow"
        aria-label="Panorama Direction"
        disabled={panning}
        onClick={() => update({ reverse: !reverse })}
      >
        <svg viewBox="0 0 41 50" aria-hidden>
          <path d="M0 16h13V4l22.7 21L13 46V34H0z" />
        </svg>
      </button>
    </div>
  );
}
