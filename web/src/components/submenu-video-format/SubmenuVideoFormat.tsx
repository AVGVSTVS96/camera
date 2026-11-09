import type { Facing, Mode, Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-video-format.css";

const steps = [91.67, 61.33, 53.33];

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
  const all = rates(settings);
  const step = steps[all.length - 2] ?? 53.33;
  const left = all.length === 4 ? 156.67 : 187.33;
  const place = (i: number, top: number) => ({ left: left + step * i, top, width: step - 8 });

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
          style={place(i, 61)}
          onClick={() => update({ format: { ...format, resolution: r } })}
        >
          {r}
        </button>
      ))}
      {all.map((rate, i) => (
        <button
          key={rate}
          className="vf-option vf-rate"
          data-on={rate === format.rate || undefined}
          data-dot={rate === dot || undefined}
          style={place(i, 105)}
          onClick={() => update({ format: { ...format, rate } })}
        >
          {rate}
        </button>
      ))}
    </Submenu>
  );
}
