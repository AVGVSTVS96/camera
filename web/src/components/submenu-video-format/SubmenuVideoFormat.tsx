import { back, defaultRate, type Facing, type Mode, type Props, type VideoFormat } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-video-format.css";

const steps = [91.67, 61.33, 53.33];

const resolutions = ["HD", "4K"] as const;

const rates = ({ mode, facing }: { mode: Mode; facing: Facing }) => {
  if (mode === "slo-mo") return [120, 240];

  const all = mode === "cinematic" ? [24, 30, 60] : [24, 30, 60, 120];

  return facing === "front" ? all.slice(0, mode === "cinematic" ? 2 : 3) : all;
};

export function SubmenuVideoFormat({ settings, update }: Props) {
  const { mode, formats } = settings;
  const format = formats[mode];

  if (!format) return null;

  const choose = (change: Partial<VideoFormat>) =>
    update({ formats: { ...formats, [mode]: { ...format, ...change } } });

  const dot = defaultRate(mode);
  const all = rates(settings);
  const step = steps[all.length - 2] ?? 53.33;
  const left = all.length === 4 ? 156.67 : 187.33;
  const place = (i: number, top: number) => ({ left: left + step * i, top, width: step - 8 });

  return (
    <Submenu title="Format" className="vf" back={() => update(back)}>
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
          onClick={() => choose({ resolution: r })}
        >
          {r}
        </button>
      ))}
      {all.map((rate, i) => (
        <button
          key={rate}
          className="vf-option vf-rate"
          aria-label={`${rate} frames per second`}
          data-on={rate === format.rate || undefined}
          data-dot={rate === dot || undefined}
          style={place(i, 105)}
          onClick={() => choose({ rate })}
        >
          {rate}
        </button>
      ))}
    </Submenu>
  );
}
