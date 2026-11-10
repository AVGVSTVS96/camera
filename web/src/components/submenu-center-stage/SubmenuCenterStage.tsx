import { back, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-center-stage.css";

const rows = [
  { key: "zoom", label: "Auto Zoom" },
  { key: "rotate", label: "Auto Rotate" },
] as const;

export function SubmenuCenterStage({ settings, update }: Props) {
  const current = settings.centerStage;

  return (
    <Submenu title="Center Stage" className="center-stage" back={() => update(back)}>
      <svg className="center-stage-defs" width="0" height="0" aria-hidden>
        <linearGradient id="center-stage-rim" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.05" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.85" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.6" />
        </linearGradient>
      </svg>
      {rows.map(({ key, label }, row) => (
        <div key={key} className="center-stage-row" style={{ top: 61 + 44 * row }}>
          <span className="center-stage-label">{label.toUpperCase()}</span>
          {[false, true].map((value) => (
            <button
              key={String(value)}
              className="center-stage-option"
              data-on={current[key] === value || undefined}
              data-value={value ? "on" : "off"}
              aria-label={value ? "On" : "Off"}
              onClick={() => update({ centerStage: { ...current, [key]: value } })}
            >
              {(key === "zoom" ? value : current[key] === value) && <i />}
              {value ? "On" : "Off"}
            </button>
          ))}
        </div>
      ))}
    </Submenu>
  );
}
