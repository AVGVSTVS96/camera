import type { ReactNode } from "react";
import type { NightMode, Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { NightAuto, NightMax, NightOff } from "./icons.tsx";
import "./submenu-night-mode.css";

const options: { id: NightMode; label: string; glyph: ReactNode }[] = [
  { id: "auto", label: "Auto", glyph: <NightAuto /> },
  { id: "max", label: "Max (1s)", glyph: <NightMax /> },
  { id: "off", label: "Off", glyph: <NightOff /> },
];

export function SubmenuNightMode({ settings, update }: Props) {
  const current = options.find((o) => o.id === settings.nightMenu) ?? options[0];

  return (
    <Submenu title="Night Mode" className="nm" back={() => update({ submenu: false, nightMenu: null })}>
      <p className="nm-value">{current.label}</p>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="nm-option"
          data-on={id === current.id || undefined}
          style={{ left: 112.67 + 75 * i }}
          aria-label={label}
          onClick={() => update({ nightMenu: id })}
        >
          {glyph}
        </button>
      ))}
    </Submenu>
  );
}
