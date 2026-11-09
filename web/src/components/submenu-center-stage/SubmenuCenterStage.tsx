import type { Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-center-stage.css";

const rows = [
  { key: "zoom", label: "Auto Zoom" },
  { key: "rotate", label: "Auto Rotate" },
] as const;

export function SubmenuCenterStage({ settings, update }: Props) {
  const current = settings.centerStage;

  if (!current) return null;

  return (
    <Submenu title="Center Stage" className="center-stage" back={() => update({ submenu: false, centerStage: null })}>
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
