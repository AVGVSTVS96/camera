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
  const stops = useProfile().zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const hide = useRef<number>(undefined);
  const active = stops.lastIndexOf(Math.max(...stops.filter((s) => s <= settings.zoom + 0.001)));

  if (!stops.length) return null;

  const place = layout(settings, stops.length);
  const [ax, ay] = place.along;

  function open() {
    clearTimeout(hide.current);
    update({ dial: true });
    hide.current = window.setTimeout(() => update({ dial: false }), 2000);
  }

  return (
    <>
      {settings.dial && (
        <svg className="zoom-dial" aria-hidden>
          <path d={place.dial} />
          <g
            className="readout"
            transform={`translate(${place.apex.x} ${place.apex.y}) rotate(${place.vertical ? 0 : place.turn})`}
          >
            <text>{zoomLabel(settings.zoom, true)}</text>
            <text y="16">13MM</text>
          </g>
        </svg>
      )}
      <div
        className="stops"
        data-dial={settings.dial || undefined}
        style={{ left: place.x, top: place.y }}
        onPointerMove={(e) => e.buttons && open()}
      >
        {stops.map((stop, i) => (
          <button
            key={i}
            data-on={i === active || undefined}
            style={{ translate: `${(i - active) * slot * ax}px ${(i - active) * slot * ay}px` }}
            onClick={() => update({ zoom: stop })}
          >
            <span className="glyph" style={{ rotate: `${place.turn}deg` }}>
              {zoomLabel(i === active ? settings.zoom : stop, i === active)}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
