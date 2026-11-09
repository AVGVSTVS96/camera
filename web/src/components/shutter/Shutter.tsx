import { useRef, type PointerEvent, type RefObject } from "react";
import type { Mode } from "../../state.ts";
import "./shutter.css";

const movies: Partial<Record<Mode, [string, string]>> = {
  "slo-mo": ["Record Slomo video", "Stop Slomo video"],
  "time-lapse": ["Record time lapse video", "Stop time lapse video"],
  video: ["Record Video", "Stop Recording Video"],
  cinematic: ["Record Video", "Stop Recording Video"],
};

const holdMs = 500;

interface ShutterProps {
  mode: Mode;
  recording: boolean;
  holding: boolean;
  lock: RefObject<HTMLElement | null>;
  onPress: () => void;
  onHold: () => void;
  onLock: () => void;
  onRelease: () => void;
}

interface Touch {
  x: number;
  y: number;
  timer: number;
  held: boolean;
  locked: boolean;
}

export function Shutter({ mode, recording, holding, lock, onPress, onHold, onLock, onRelease }: ShutterProps) {
  const touch = useRef<Touch>(undefined);
  const swallow = useRef(false);
  const stopping = recording || holding;
  const label = movies[mode]?.[stopping ? 1 : 0] ?? (stopping ? "Stop Recording Video" : "Take Picture");

  function down(e: PointerEvent<HTMLButtonElement>) {
    swallow.current = false;

    if (mode !== "photo" || recording) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    const timer = window.setTimeout(() => {
      if (touch.current) touch.current.held = true;
      onHold();
    }, holdMs);

    touch.current = { x: e.clientX, y: e.clientY, timer, held: false, locked: false };
  }

  function move(e: PointerEvent<HTMLButtonElement>) {
    const t = touch.current;
    const target = lock.current?.getBoundingClientRect();

    if (!t?.held || t.locked || !target) return;

    const toward = { x: target.x + target.width / 2 - t.x, y: target.y + target.height / 2 - t.y };
    const slid = (e.clientX - t.x) * toward.x + (e.clientY - t.y) * toward.y;

    if (slid < toward.x ** 2 + toward.y ** 2) return;

    t.locked = true;
    onLock();
  }

  function up() {
    const t = touch.current;

    if (!t) return;

    clearTimeout(t.timer);
    touch.current = undefined;
    swallow.current = t.held;

    if (t.held && !t.locked) onRelease();
  }

  function click() {
    if (!swallow.current) return onPress();

    swallow.current = false;
  }

  return (
    <button
      className="shutter-button"
      aria-label={label}
      onClick={click}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    >
      <span />
    </button>
  );
}
