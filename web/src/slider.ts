import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { Settings } from "./state.ts";

interface Slider {
  value: number;
  min: number;
  max: number;
  pitch: number;
  settings: Pick<Settings, "display" | "orientation">;
  set: (value: number) => void;
}

const turnOf = ({ display, orientation }: Slider["settings"]) =>
  orientation === "landscape" ? 90 : display === "inner" ? 180 : 0;

// Apple's adjustable slider in whole steps: arrows step it, a drag along the strip moves it, and `pitch` is the signed pixels along the strip per step.
export function useSlider({ value, min, max, pitch, settings, set }: Slider) {
  const start = useRef<{ x: number; y: number; value: number }>(null);

  const to = (next: number) => {
    const clamped = Math.min(max, Math.max(min, next));

    if (clamped !== value) set(clamped);
  };

  const along = (e: PointerEvent, from: { x: number; y: number }) => {
    const dx = e.clientX - from.x;
    const dy = e.clientY - from.y;
    const turn = turnOf(settings);

    return turn === 90 ? dy : turn === 180 ? -dx : dx;
  };

  return {
    tabIndex: 0,
    style: { touchAction: "none" },
    "aria-valuemin": min,
    "aria-valuemax": max,
    onKeyDown(e: KeyboardEvent) {
      const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];

      if (!by) return;

      e.preventDefault();
      to(value + by);
    },
    onPointerDown(e: PointerEvent) {
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { x: e.clientX, y: e.clientY, value };
    },
    onPointerMove(e: PointerEvent) {
      if (start.current) to(start.current.value + Math.round(along(e, start.current) / pitch));
    },
    onPointerUp: () => (start.current = null),
    onPointerCancel: () => (start.current = null),
  };
}
