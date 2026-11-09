import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { crossfade } from "../../crossfade.ts";
import { useProfile } from "../../profile.ts";
import { movieModes, type Mode } from "../../state.ts";
import "./mode-dial.css";

const slop = 8;
const reach = 40;

/** Pointer travel along the dial's own axis, which the dial's rotation turns on the screen. */
function along(dial: HTMLElement, dx: number, dy: number) {
  const turn = (Number.parseFloat(getComputedStyle(dial).rotate) || 0) * (Math.PI / 180);

  return { along: dx * Math.cos(turn) + dy * Math.sin(turn), across: dy * Math.cos(turn) - dx * Math.sin(turn) };
}

const blur = [
  { filter: "blur(0)" },
  { filter: "blur(6px)", offset: 0.5 },
  { filter: "blur(3px)", offset: 0.8 },
  { filter: "blur(0)" },
];

/** The viewfinder blurs while it resizes between 4:3 and 16:9 inside a frame that shows its edge. */
function resize({ delay, duration, easing }: KeyframeAnimationOptions) {
  const timing = { delay, duration, easing, fill: "backwards" } as const;
  const viewfinder = document.querySelector(".viewfinder");

  for (const child of viewfinder?.children ?? []) child.animate(blur, timing);
}

function switchTiming() {
  const root = getComputedStyle(document.documentElement);

  return {
    delay: Number.parseFloat(root.getPropertyValue("--switch-delay")) * 1000,
    duration: Number.parseFloat(root.getPropertyValue("--switch-time")) * 1000,
    easing: root.getPropertyValue("--switch-ease"),
  };
}

export function ModeDial({ selected, select: apply }: { selected: Mode; select: (mode: Mode) => void }) {
  const { modes, name } = useProfile();

  const dial = useRef<HTMLDivElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [pill, setPill] = useState(0);
  const [drag, setDrag] = useState<number>();
  const [settled, setSettled] = useState(false);

  const select = useCallback(
    (mode: Mode) => {
      if (mode === selected) return;

      document.documentElement.dataset.switch = movieModes.has(mode) ? "movie" : "still";

      const timing = switchTiming();

      if (movieModes.has(mode) !== movieModes.has(selected)) {
        resize(timing);
      }

      crossfade(() => apply(mode), timing);
    },
    [apply, selected],
  );

  const measure = useCallback(() => {
    const label = labels.current?.querySelector<HTMLElement>(`[data-mode="${selected}"]`);

    if (!label) return;

    setOffset(-(label.offsetLeft + label.offsetWidth / 2));
    const { width, paddingLeft, paddingRight } = getComputedStyle(label);
    setPill([width, paddingLeft, paddingRight].reduce((sum, px) => sum + Number.parseFloat(px), 0));
  }, [selected]);

  useLayoutEffect(measure, [measure]);

  useEffect(() => {
    document.fonts.ready.then(() => {
      measure();
      setSettled(true);
    });
  }, [measure]);

  const step = useCallback(
    (by: number) => {
      const next = modes[modes.indexOf(selected) + by];

      if (next) select(next);
    },
    [modes, selected, select],
  );

  const swiped = useEffectEvent(step);

  useEffect(() => {
    const screen = dial.current?.closest<HTMLElement>(".screen");

    if (!screen) return;

    let start: { x: number; y: number; id: number } | undefined;

    const down = (e: PointerEvent) => {
      // SAFETY: pointerdown on the screen always targets an element.
      const target = e.target as Element;

      start =
        e.isPrimary && !screen.dataset.sheet && !target.closest('button, input, [role="slider"], .dial, .zoom')
          ? { x: e.clientX, y: e.clientY, id: e.pointerId }
          : undefined;
    };

    const up = (e: PointerEvent) => {
      if (!start || start.id !== e.pointerId || !dial.current) return;

      const { along: a, across } = along(dial.current, e.clientX - start.x, e.clientY - start.y);
      start = undefined;

      if (Math.abs(a) >= reach && Math.abs(a) > Math.abs(across)) swiped(a > 0 ? -1 : 1);
    };

    screen.addEventListener("pointerdown", down);
    screen.addEventListener("pointerup", up);

    return () => {
      screen.removeEventListener("pointerdown", down);
      screen.removeEventListener("pointerup", up);
    };
  }, []);

  function press(e: React.PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary) return;

    const origin = { x: e.clientX, y: e.clientY };
    const el = e.currentTarget;
    let moved = false;

    const travel = (m: PointerEvent) => along(dial.current!, m.clientX - origin.x, m.clientY - origin.y).along;

    const move = (m: PointerEvent) => {
      const a = travel(m);

      if (!moved && Math.abs(a) < slop) return;

      if (!moved) el.setPointerCapture(e.pointerId);

      moved = true;
      setDrag(a);
    };

    const end = (m: PointerEvent) => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);

      if (!moved) return;

      el.addEventListener("click", (c) => c.stopPropagation(), { capture: true, once: true });
      setDrag(undefined);

      const centre = -(offset + travel(m));
      const strip = [...labels.current!.querySelectorAll<HTMLElement>("[data-mode]")];
      const middle = (label: HTMLElement) => label.offsetLeft + label.offsetWidth / 2;
      const gap = (label: HTMLElement) => Math.abs(middle(label) - centre);

      const nearest = strip.reduce((best, label) => (gap(label) < gap(best) ? label : best));

      // SAFETY: every label in the strip is rendered with a data-mode from `modes`.
      select(nearest.dataset.mode as Mode);
    };

    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  }

  return (
    <div className="dial" data-profile={name} aria-label="Camera Mode" ref={dial}>
      <div className="window" onPointerDown={press}>
        <i className="pill" data-settled={settled || undefined} style={{ width: pill }} />
        <div
          className="labels"
          ref={labels}
          data-settled={settled || undefined}
          data-dragging={drag !== undefined || undefined}
          style={{ translate: `${offset + (drag ?? 0)}px` }}
        >
          {modes.map((mode) => (
            <button key={mode} data-mode={mode} data-on={mode === selected || undefined} onClick={() => select(mode)}>
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
