import { useRef } from "react";
import { useProfile } from "../../profile.ts";
import type { Props } from "../../state.ts";
import { layout, slot } from "./layout.ts";
import "./zoom.css";

function zoomLabel(value: number, active: boolean) {
  const text = String(Math.round(value * 10) / 10);

  return active ? `${text}×` : text.replace(/^0/, "");
}

export function Zoom({ settings, update }: Props) {
  const profile = useProfile();
  const own = profile.zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const stops = settings.lenses ? [0.5, 1, 2, settings.zoom === 0.5 ? 1 : settings.zoom] : own;
  const hide = useRef<number>(undefined);

  const showDial = settings.dial && (settings.mode === "photo" || settings.mode === "video");
  const anchored = stops.length === 1 || settings.lenses;

  const active = settings.lenses
    ? settings.zoom === 0.5
      ? 0
      : stops.length - 1
    : stops.lastIndexOf(Math.max(...stops.filter((s) => s <= settings.zoom + 0.001)));

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
            transform={`translate(${place.apex.x - place.into[0] * 37} ${place.apex.y - place.into[1] * 37}) rotate(${place.vertical || place.turn ? 90 * Number(place.turn > 0) : 0})`}
          >
            <text y="5">{zoomLabel(settings.zoom, true)}</text>
            <text y="21">13MM</text>
          </g>
        </svg>
      )}
      <div
        className="stops"
        data-dial={showDial || undefined}
        style={{ left: place.x, top: place.y }}
        onPointerMove={(e) => e.buttons && open()}
      >
        {stops.map((stop, i) => (
          <button
            key={i}
            data-on={i === active || undefined}
            style={{ translate: offset(i) }}
            onClick={() => (anchored && stops.length === 1 ? update({ lenses: true }) : update({ zoom: stop }))}
          >
            <span className="glyph">{zoomLabel(i === active ? settings.zoom : stop, i === active)}</span>
          </button>
        ))}
      </div>
    </>
  );
}
