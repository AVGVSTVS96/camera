import { useProfile } from "../../profile.ts";
import type { Props } from "../../state.ts";
import "./zoom.css";

function zoomLabel(value: number, active: boolean) {
  const text = String(Math.round(value * 10) / 10).replace(/^0/, "");

  return active ? `${text}×` : text;
}

export function Zoom({ settings, update }: Props) {
  const stops = useProfile().zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const active = stops.indexOf(Math.max(...stops.filter((s) => s <= settings.zoom + 0.001)));

  if (!stops.length) return null;

  return (
    <div className="stops">
      {stops.map((stop, i) => (
        <button key={i} data-on={i === active || undefined} onClick={() => update({ zoom: stop })}>
          <span className="glyph">{zoomLabel(i === active ? settings.zoom : stop, i === active)}</span>
        </button>
      ))}
    </div>
  );
}
