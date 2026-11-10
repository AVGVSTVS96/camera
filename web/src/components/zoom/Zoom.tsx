import { useEffect, useRef } from "react";
import { useProfile } from "../../profile.ts";
import type { Props, Settings } from "../../state.ts";
import { layout, slot } from "./layout.ts";
import "./zoom.css";

function zoomLabel(value: number, active: boolean, bare: boolean) {
  const text = String(Math.round(value * 10) / 10);

  return active ? `${text}×` : bare ? text.replace(/^0/, "") : text;
}

const degrees = 55.9;
const labelled = new Set([1, 2, 5, 10]);
const ticks = Array.from({ length: 46 }, (_, i) => Math.round((0.5 + i * 0.1) * 10) / 10);

/** Apple's dial scale: every tenth of a zoom factor, angle proportional to its logarithm. */
function Ticks({ place, zoom }: { place: ReturnType<typeof layout>; zoom: number }) {
  const [ux, uy] = place.along;
  const [nx, ny] = place.into;
  const { centre, radius } = place;
  // Apple's portrait dial rests 1.55 degrees short of its marker
  const bias = place.vertical ? 0 : 1.55;
  const at = (angle: number, r: number) => [
    centre.x + nx * r * Math.cos(angle) + ux * r * Math.sin(angle),
    centre.y + ny * r * Math.cos(angle) + uy * r * Math.sin(angle),
  ];

  return (
    <g className="ticks">
      {ticks.map((z) => {
        const angle = ((degrees * Math.log(z / zoom) - bias) * Math.PI) / 180;

        if (Math.abs(angle) > 1.22) return null;

        const major = Number.isInteger(z);
        const away = Math.abs((angle * 180) / Math.PI);
        const fade = Math.min(1, Math.max(0, major ? (58 - away) / 10 : (42 - away) / 12));
        const [x1, y1] = at(angle, radius - 20.5);
        const [x2, y2] = at(angle, radius - 4);
        const [lx, ly] = at(angle, radius - 36);
        const [mx, my] = at(angle, radius - 51);
        const up = (Math.atan2(centre.x - lx, ly - centre.y) * 180) / Math.PI;

        return (
          <g key={z}>
            <line className={major ? "major" : undefined} opacity={fade} x1={x1} y1={y1} x2={x2} y2={y2} />
            {labelled.has(z) && (
              <g opacity={fade}>
                <text className="stop" transform={`translate(${lx} ${ly}) rotate(${place.vertical ? up + 180 : up})`}>
                  {z}
                </text>
                <text className="focal" transform={`translate(${mx} ${my}) rotate(${place.vertical ? up : up + 180})`}>
                  {Math.round(z * 26)}MM
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
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

const lensBlur = [
  { filter: "blur(0)" },
  { filter: "blur(4px)", offset: 0.1 },
  { filter: "blur(8px)", offset: 0.85 },
  { filter: "blur(0)" },
];

/** The preview blurs while Camera ramps to a tapped stop. */
function zoomTo(stop: number, from: number, update: Props["update"]) {
  if (stop !== from) document.querySelector(".viewfinder")?.animate(lensBlur, { duration: 550, delay: 40 });

  update({ zoom: stop });
}

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

const round = (value: number) => Math.round(value * 100) / 100;

const tenth = (value: number) => Math.round(value * 10) / 10;

export function Zoom({ settings, update }: Props) {
  const profile = useProfile();
  const own = profile.zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const stops = settings.lenses ? [0.5, 1, 2, settings.zoom === 0.5 ? 1 : settings.zoom] : stopsOf(settings, own);
  const self = useRef<HTMLDivElement>(null);
  const zoom = Math.max(settings.zoom, Math.min(...stops));
  const bare = settings.mode === "time-lapse" || settings.mode === "portrait" || profile.name === "duo";
  const hide = useRef<number>(undefined);
  const held = useRef(false);

  const dialModes = ["photo", "video", "cinematic", "slo-mo"];

  const showDial =
    settings.dial &&
    stops.length > 0 &&
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
  const cinematic = settings.mode === "cinematic";
  const latest = useRef({ zoom: settings.zoom, low, high, update });

  useEffect(() => {
    latest.current = { zoom: settings.zoom, low, high, update };
  });

  function drag(e: React.PointerEvent<HTMLDivElement>) {
    const grab = e.currentTarget;
    const from = { x: e.clientX, y: e.clientY, zoom: settings.zoom };
    let turning = false;
    held.current = false;

    const press = window.setTimeout(() => {
      held.current = true;
      clearTimeout(hide.current);
      update({ dial: true, ...(settings.mode === "portrait" && { lenses: true }) });
    }, 500);

    const move = (m: PointerEvent) => {
      const along = ((m.clientX - from.x) * Math.abs(ax) + (m.clientY - from.y) * Math.abs(ay)) * (cinematic ? -1 : 1);

      if (!turning && Math.hypot(m.clientX - from.x, m.clientY - from.y) < 8) return;

      clearTimeout(press);

      if (!turning) grab.setPointerCapture(e.pointerId);

      turning = true;
      clearTimeout(hide.current);
      update({
        dial: true,
        ...(settings.mode !== "time-lapse" && {
          zoom: tenth(clamp(from.zoom * 2 ** (along / (cinematic ? place.perDoubling : 25)), low, high)),
        }),
        ...(settings.mode === "portrait" && { lenses: true }),
      });
    };

    const end = () => {
      clearTimeout(press);

      if (turning || held.current) hide.current = window.setTimeout(() => update({ dial: false }), 1750);

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
          {place.inner && zoom > low + 0.001 ? (
            <>
              <Ticks place={place} zoom={zoom} />
              <text
                className="now"
                transform={`translate(${place.centre.x + place.into[0] * (place.radius - 35)} ${place.centre.y + place.into[1] * (place.radius - 35)}) rotate(${place.vertical ? 90 : 0})`}
              >
                {zoomLabel(zoom, true, bare)}
              </text>
            </>
          ) : (
            <g
              className="readout"
              transform={`translate(${place.apex.x - place.into[0] * 37} ${place.apex.y - place.into[1] * 37}) rotate(${place.turn ? 90 : 0})`}
            >
              <text y="5">{zoomLabel(zoom, true, bare)}</text>
              <text y="21">{Math.round(zoom * 26)}MM</text>
            </g>
          )}
        </svg>
      )}
      <div
        ref={self}
        className="zoom"
        data-dial={showDial || undefined}
        style={{ left: place.x, top: place.y }}
        onPointerDown={drag}
        onClickCapture={(e) => held.current && e.stopPropagation()}
      >
        {stops.map((stop, i) => (
          <button
            key={i}
            data-on={i === active || undefined}
            style={{ translate: offset(i), rotate: `${settings.zoomTurn}deg` }}
            onClick={() =>
              anchored && stops.length === 1 ? update({ lenses: true }) : zoomTo(stop, settings.zoom, update)
            }
          >
            {zoomLabel(i === active ? zoom : stop, i === active, bare)}
          </button>
        ))}
      </div>
    </>
  );
}
