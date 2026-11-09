import type { ReactNode } from "react";
import { back, type NightMode, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { NightAuto, NightMax, NightOff } from "./icons.tsx";
import "./submenu-night-mode.css";

const options: { id: NightMode; label: string; value: string; glyph: ReactNode }[] = [
  { id: "auto", label: "Auto", value: "Auto", glyph: <NightAuto /> },
  { id: "max", label: "Max", value: "Max (1s)", glyph: <NightMax /> },
  { id: "off", label: "Off", value: "Off", glyph: <NightOff /> },
];

export function SubmenuNightMode({ settings, update }: Props) {
  const current = options.find((o) => o.id === settings.night) ?? options[0];

  return (
    <Submenu title="Night Mode" className="nm" back={() => update(back)}>
      <p className="nm-value">{current.value}</p>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="nm-option"
          data-on={id === current.id || undefined}
          style={{ left: 112.67 + 75 * i }}
          aria-label={label}
          onClick={() => update({ night: id })}
        >
          {glyph}
        </button>
      ))}
    </Submenu>
  );
}
