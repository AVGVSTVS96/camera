import type { Facing, Mode, Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-video-format.css";

const resolutions = ["HD", "4K"] as const;

const rates = ({ mode, facing }: { mode: Mode; facing: Facing }) => {
  if (mode === "slo-mo") return [120, 240];

  const all = mode === "cinematic" ? [24, 30, 60] : [24, 30, 60, 120];

  return facing === "front" ? all.slice(0, mode === "cinematic" ? 2 : 3) : all;
};

export const defaultRate = (mode: Mode) => (mode === "slo-mo" ? 120 : 30);

export function SubmenuVideoFormat({ settings, update }: Props) {
  const { mode, format } = settings;

  if (!format) return null;

  const dot = defaultRate(mode);

  return (
    <Submenu title="Format" className="vf" back={() => update({ submenu: false, format: null })}>
      <p className="vf-label" style={{ top: 77 }}>
        Resolution
      </p>
      <p className="vf-label" style={{ top: 121 }}>
        Frame Rate
      </p>
      {resolutions.map((r, i) => (
        <button
          key={r}
          className="vf-option"
          data-on={r === format.resolution || undefined}
          data-dot={r === "HD" || undefined}
          style={{ left: 156.67 + 53.33 * i, top: 61 }}
          onClick={() => update({ format: { ...format, resolution: r } })}
        >
          {r}
        </button>
      ))}
      {rates(settings).map((rate, i) => (
        <button
          key={rate}
          className="vf-option vf-rate"
          data-on={rate === format.rate || undefined}
          data-dot={rate === dot || undefined}
          style={{ left: 156.67 + 53.33 * i, top: 105 }}
          onClick={() => update({ format: { ...format, rate } })}
        >
          {rate}
        </button>
      ))}
    </Submenu>
  );
}
