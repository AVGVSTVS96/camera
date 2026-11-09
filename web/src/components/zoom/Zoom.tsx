import { useRef } from "react";
import { useProfile } from "../../profile.ts";
import type { Props, Settings } from "../../state.ts";
import { layout, slot } from "./layout.ts";
import "./zoom.css";

function zoomLabel(value: number, active: boolean, bare: boolean) {
  const text = String(Math.round(value * 10) / 10);

  return active ? `${text}×` : bare ? text.replace(/^0/, "") : text;
}

function stopsOf({ mode, format, display, orientation }: Settings, own: number[]) {
  if (!format) return own;

  if (mode === "video")
    return format.rate === 120 && !(display === "inner" && orientation === "portrait") ? [1, 2] : own;

  if (mode !== "slo-mo") return own;

  if (format.rate === 240) return [0.5, 1, 1];

  return format.resolution === "4K" ? [1, 2] : own;
}

export function Zoom({ settings, update }: Props) {
  const profile = useProfile();
  const own = profile.zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const stops = settings.lenses ? [0.5, 1, 2, settings.zoom === 0.5 ? 1 : settings.zoom] : stopsOf(settings, own);
  const zoom = Math.max(settings.zoom, Math.min(...stops));
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

  if (!stops.length) return null;

  const place = layout(settings, profile.name === "duo");
  const [ax, ay] = place.along;
  const shift = anchored ? place.lone - (place.vertical ? place.y : place.x) : 0;
  const marker = Math.atan2(-place.into[1], -place.into[0]) * (180 / Math.PI) - 90;

  function open() {
    clearTimeout(hide.current);
    update({ dial: true });
    hide.current = window.setTimeout(() => update({ dial: false }), 2000);
  }

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
          <g
            className="readout"
            transform={`translate(${place.apex.x - place.into[0] * 37} ${place.apex.y - place.into[1] * 37}) rotate(${place.turn ? 90 : 0})`}
          >
            <text y="5">{zoomLabel(zoom, true, bare)}</text>
            <text y="21">{Math.round(zoom * 26)}MM</text>
          </g>
        </svg>
      )}
      <div
        className="zoom"
        data-dial={showDial || undefined}
        style={{ left: place.x, top: place.y }}
        onPointerMove={(e) => e.buttons && open()}
      >
        {stops.map((stop, i) => (
          <button
            key={i}
            data-on={i === active || undefined}
            style={{ translate: offset(i), rotate: `${settings.zoomTurn}deg` }}
            onClick={() => (anchored && stops.length === 1 ? update({ lenses: true }) : update({ zoom: stop }))}
          >
            {zoomLabel(i === active ? zoom : stop, i === active, bare)}
          </button>
        ))}
      </div>
    </>
  );
}
