import { useEffect, useRef, useState } from "react";
import { useProfile } from "../../profile.ts";
import type { Props, Settings } from "../../state.ts";
import { layout, slot } from "./layout.ts";
import "./zoom.css";

function zoomLabel(value: number, active: boolean, bare: boolean) {
  const text = String(Math.round(value * 10) / 10);

  return active ? `${text}×` : bare ? text.replace(/^0/, "") : text;
}

function stopsOf({ mode, formats, display, orientation }: Settings, own: number[]) {
  const format = formats[mode];

  if (!format) return own;

  if (mode === "video")
    return format.rate === 120 && !(display === "inner" && orientation === "portrait") ? [1, 2] : own;

  if (mode !== "slo-mo") return own;

  if (format.rate === 240) return [0.5, 1, 1];

  return format.resolution === "4K" ? [1, 2] : own;
}

const perDoubling = 25;

const rampSeconds = 0.55;

function useRamp(target: number, key: string) {
  const [value, setValue] = useState(target);
  const current = useRef({ value: target, key });

  useEffect(() => {
    const from = current.current.value;
    const same = current.current.key === key;
    current.current.key = key;

    if (!same || from === target) {
      current.current.value = target;
      setValue(target);

      return;
    }

    const start = performance.now();

    let frame = requestAnimationFrame(function step() {
      const t = Math.min(1, (performance.now() - start) / (rampSeconds * 1000));
      current.current.value = from + (target - from) * t;
      setValue(current.current.value);

      if (t < 1) frame = requestAnimationFrame(step);
    });

    return () => cancelAnimationFrame(frame);
  }, [target, key]);

  return value;
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const round = (value: number) => Math.round(value * 100) / 100;

export function Zoom({ settings, update }: Props) {
  const profile = useProfile();
  const own = profile.zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const stops = settings.lenses ? [0.5, 1, 2, settings.zoom === 0.5 ? 1 : settings.zoom] : stopsOf(settings, own);
  const zoom = Math.max(settings.zoom, Math.min(...stops));
  const labelled = useRamp(zoom, `${settings.facing}-${settings.mode}`);
  const bare = settings.mode === "time-lapse" || settings.mode === "portrait" || profile.name === "duo";
  const hide = useRef<number>(undefined);

  const dialModes = ["photo", "video", "cinematic", "slo-mo"];

  const showDial =
    settings.dial &&
    dialModes.includes(settings.mode) &&
    !(settings.mode === "slo-mo" && settings.display === "outer" && settings.orientation === "portrait");

  const anchored = stops.length === 1 || settings.lenses;

  const active = settings.lenses
    ? settings.zoom === 0.5
      ? 0
      : stops.length - 1
    : stops.lastIndexOf(Math.max(...stops.filter((s) => s <= zoom + 0.001)));

  const place = layout(settings, profile.name === "duo");
  const [ax, ay] = place.along;
  const shift = anchored ? place.lone - (place.vertical ? place.y : place.x) : 0;
  const marker = Math.atan2(-place.into[1], -place.into[0]) * (180 / Math.PI) - 90;

  const front = settings.facing === "front";
  const low = front ? 1 : settings.mode === "portrait" ? 0.5 : Math.min(...stops);
  const high = front ? 2 : Math.max(10, ...stops);
  const self = useRef<HTMLDivElement>(null);
  const shown = stops.length > 0;
  const latest = useRef({ zoom: settings.zoom, low, high, update });

  useEffect(() => {
    latest.current = { zoom: settings.zoom, low, high, update };
  });

  function drag(e: React.PointerEvent<HTMLDivElement>) {
    const grab = e.currentTarget;
    const from = { x: e.clientX, y: e.clientY, zoom: settings.zoom };
    let turning = false;

    const move = (m: PointerEvent) => {
      const along = (m.clientX - from.x) * Math.abs(ax) + (m.clientY - from.y) * Math.abs(ay);

      if (!turning && Math.hypot(m.clientX - from.x, m.clientY - from.y) < 8) return;

      if (!turning) grab.setPointerCapture(e.pointerId);

      turning = true;
      clearTimeout(hide.current);
      update({
        dial: true,
        zoom: round(clamp(from.zoom * 2 ** (along / perDoubling), low, high)),
        ...(settings.mode === "portrait" && { lenses: true }),
      });
    };

    const end = () => {
      if (turning) hide.current = window.setTimeout(() => update({ dial: false }), 1750);

      grab.removeEventListener("pointermove", move);
      grab.removeEventListener("pointerup", end);
      grab.removeEventListener("pointercancel", end);
    };

    grab.addEventListener("pointermove", move);
    grab.addEventListener("pointerup", end);
    grab.addEventListener("pointercancel", end);
  }

  useEffect(() => {
    const screen = self.current?.closest<HTMLElement>(".screen");

    if (!screen) return;

    const touches = new Map<number, { x: number; y: number }>();
    let pinch: { span: number; zoom: number } | undefined;

    const span = () => {
      const [a, b] = [...touches.values()];

      return Math.hypot(b.x - a.x, b.y - a.y);
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;

      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      pinch = touches.size === 2 ? { span: span(), zoom: latest.current.zoom } : undefined;
    };

    const move = (e: PointerEvent) => {
      if (!touches.has(e.pointerId)) return;

      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (!pinch) return;

      const range = latest.current;
      range.update({ zoom: round(clamp(pinch.zoom * (span() / pinch.span), range.low, range.high)) });
    };

    const up = (e: PointerEvent) => {
      touches.delete(e.pointerId);
      pinch = undefined;
    };

    screen.addEventListener("pointerdown", down);
    screen.addEventListener("pointermove", move);
    screen.addEventListener("pointerup", up);
    screen.addEventListener("pointercancel", up);

    return () => {
      screen.removeEventListener("pointerdown", down);
      screen.removeEventListener("pointermove", move);
      screen.removeEventListener("pointerup", up);
      screen.removeEventListener("pointercancel", up);
    };
  }, []);

  const offset = (i: number) => {
    const k = anchored ? i : i - active;
    const along = k * slot;

    return `${along * ax + (place.vertical ? 0 : shift)}px ${along * ay + (place.vertical ? shift : 0)}px`;
  };

  if (!shown) return null;

  return (
    <>
      {showDial && (
        <svg className="zoom-dial" aria-hidden>
          <path d={place.dial} />
          <polygon
            className="marker"
            points="-3 0 3 0 0 12"
            transform={`translate(${place.apex.x - place.into[0] * 10} ${place.apex.y - place.into[1] * 10}) rotate(${marker})`}
          />
          <g
            className="readout"
            transform={`translate(${place.apex.x - place.into[0] * 37} ${place.apex.y - place.into[1] * 37}) rotate(${place.turn ? 90 : 0})`}
          >
            <text y="5">{zoomLabel(labelled, true, bare)}</text>
            <text y="21">{Math.round(labelled * 26)}MM</text>
          </g>
        </svg>
      )}
      <div
        ref={self}
        className="zoom"
        data-dial={showDial || undefined}
        style={{ left: place.x, top: place.y }}
        onPointerDown={drag}
      >
        {stops.map((stop, i) => (
          <button
            key={i}
            data-on={i === active || undefined}
            style={{ translate: offset(i), rotate: `${settings.zoomTurn}deg` }}
            onClick={() => (anchored && stops.length === 1 ? update({ lenses: true }) : update({ zoom: stop }))}
          >
            {zoomLabel(i === active ? labelled : stop, i === active, bare)}
          </button>
        ))}
      </div>
    </>
  );
}
