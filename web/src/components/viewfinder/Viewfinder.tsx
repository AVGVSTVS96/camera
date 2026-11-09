import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { MAX_BIAS, type Props } from "../../state.ts";
import "./viewfinder.css";

const HOLD = 500;
const SLOP = 8;
const PX_PER_STOP = 35.75;

const clamp = (bias: number) => Math.round(Math.min(MAX_BIAS, Math.max(-MAX_BIAS, bias)) * 10) / 10;

const aim = (e: PointerEvent) => {
  const box = e.currentTarget.getBoundingClientRect();

  return { x: e.clientX - box.x, y: e.clientY - box.y };
};

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
  const [square, setSquare] = useState<{ x: number; y: number; key: number }>();
  const touch = useRef<Touch>(undefined);
  const idle = settings.tray || settings.submenu || settings.sheet || settings.viewer;
  const { exposure, lock } = settings;

  const focus = (e: PointerEvent, locked: boolean) => {
    setSquare((s) => ({ ...aim(e), key: (s?.key ?? 0) + 1 }));
    update({ lock: locked });
  };

  const end = () => {
    clearTimeout(touch.current?.timer);
    touch.current = undefined;
  };

  const down = (e: PointerEvent) => {
    if (idle) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    const held = aim(e);

    touch.current = {
      ...held,
      bias: exposure,
      moved: false,
      timer: window.setTimeout(() => {
        touch.current!.moved = true;
        setSquare((s) => ({ ...held, key: (s?.key ?? 0) + 1 }));
        update({ lock: true });
      }, HOLD),
    };
  };

  const move = (e: PointerEvent) => {
    const t = touch.current;

    if (!t) return;

    const dy = e.clientY - e.currentTarget.getBoundingClientRect().y - t.y;

    if (!t.moved && Math.abs(dy) < SLOP) return;

    t.moved = true;
    clearTimeout(t.timer);

    if (square) update({ exposure: clamp(t.bias - dy / PX_PER_STOP) });
  };

  const up = (e: PointerEvent) => {
    const t = touch.current;

    if (t && !t.moved) focus(e, false);

    end();
  };

  return (
    <div
      className="viewfinder"
      role="img"
      aria-label="Viewfinder"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={end}
    >
      {children}
      {!still && square && (
        <div
          key={square.key}
          className="viewfinder-focus"
          data-locked={lock || undefined}
          data-flip={square.x > innerWidth / 2 || undefined}
          style={{ left: square.x, top: square.y }}
          onAnimationEnd={() => !lock && setSquare(undefined)}
        >
          <i className="viewfinder-box" />
          <i className="viewfinder-bias">
            <b style={{ translate: `0 ${-exposure * PX_PER_STOP}px` }}>
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
