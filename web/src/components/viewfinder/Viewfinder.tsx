import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import type { Props } from "../../state.ts";
import "./viewfinder.css";

const HOLD = 500;
const SLOP = 8;
const PX_PER_STOP = 35.75;
const MAX_BIAS = 2;

const clamp = (bias: number) => Math.round(Math.min(MAX_BIAS, Math.max(-MAX_BIAS, bias)) * 10) / 10;

interface Square {
  x: number;
  y: number;
  flip: boolean;
  bias: number;
  scene: string;
  key: number;
}

interface Touch {
  x: number;
  y: number;
  bias: number;
  timer: number;
  moved: boolean;
}

interface ViewfinderProps extends Props {
  still: boolean;
  children: ReactNode;
}

export function Viewfinder({ settings, update, still, children }: ViewfinderProps) {
  const [square, setSquare] = useState<Square>();
  const touch = useRef<Touch>(undefined);
  const idle = settings.tray || settings.submenu || settings.sheet || settings.viewer;
  const scene = `${settings.mode} ${settings.facing}`;
  const shown = square?.scene === scene ? square : undefined;
  const { lock } = settings;

  const sideways = settings.orientation === "landscape";
  const up = (dx: number, dy: number) => (sideways ? dx : -dy);

  const end = () => {
    clearTimeout(touch.current?.timer);
    touch.current = undefined;
  };

  const focus = (x: number, y: number, box: DOMRect, locked: boolean) => {
    const flip = sideways ? y > box.height / 2 : x > box.width / 2;
    setSquare((s) => ({ x, y, flip, bias: 0, scene, key: (s?.key ?? 0) + 1 }));
    update({ lock: locked });
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.isPrimary) return end();

    if (idle) return;

    const box = e.currentTarget.getBoundingClientRect();
    const [x, y] = [e.clientX - box.x, e.clientY - box.y];
    e.currentTarget.setPointerCapture(e.pointerId);

    touch.current = {
      x,
      y,
      bias: shown?.bias ?? 0,
      moved: false,
      timer: window.setTimeout(() => {
        if (touch.current) touch.current.moved = true;
        focus(x, y, box, true);
      }, HOLD),
    };
  };

  const move = (e: PointerEvent<HTMLDivElement>) => {
    const t = touch.current;

    if (!t || !e.isPrimary) return;

    const box = e.currentTarget.getBoundingClientRect();
    const [dx, dy] = [e.clientX - box.x - t.x, e.clientY - box.y - t.y];

    if (!t.moved && Math.hypot(dx, dy) < SLOP) return;

    t.moved = true;
    clearTimeout(t.timer);

    const rise = up(dx, dy);
    const across = sideways ? dy : dx;

    if (shown && Math.abs(rise) > Math.abs(across)) {
      const bias = clamp(t.bias + rise / PX_PER_STOP);
      setSquare({ ...shown, bias });
    }
  };

  const release = (e: PointerEvent<HTMLDivElement>) => {
    const t = touch.current;

    if (t && !t.moved && e.isPrimary) focus(t.x, t.y, e.currentTarget.getBoundingClientRect(), false);

    end();
  };

  return (
    <div
      className="viewfinder"
      role="img"
      aria-label="Viewfinder"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={release}
      onPointerCancel={end}
    >
      {children}
      {!still && shown && (
        <div
          key={shown.key}
          className="viewfinder-focus"
          data-locked={lock || undefined}
          data-flip={shown.flip || undefined}
          style={{ left: shown.x, top: shown.y }}
          onAnimationEnd={() => !lock && setSquare(undefined)}
        >
          <i className="viewfinder-box" />
          <i className="viewfinder-bias">
            <b style={{ translate: `0 ${-shown.bias * PX_PER_STOP}px` }}>
              <Sun />
            </b>
          </i>
        </div>
      )}
      {!still && lock && <span className="viewfinder-badge">AE/AF LOCK</span>}
    </div>
  );
}

const Sun = () => (
  <svg
    width="25"
    height="25"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" />
  </svg>
);
