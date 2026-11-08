import type { ReactNode } from "react";
import type { Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { Awb, Bulb, Cloud, Shade, Sun, Tube } from "./icons.tsx";
import "./submenu-white-balance.css";

const options: { id: string; label: string; kelvin?: number; glyph: ReactNode }[] = [
  { id: "auto", label: "Auto White Balance", glyph: <Awb /> },
  { id: "tungsten", label: "Tungsten", kelvin: 3200, glyph: <Bulb /> },
  { id: "fluorescent", label: "Fluorescent", kelvin: 4000, glyph: <Tube /> },
  { id: "daylight", label: "Daylight", kelvin: 5500, glyph: <Sun /> },
  { id: "cloudy", label: "Cloudy", kelvin: 6500, glyph: <Cloud /> },
  { id: "shadow", label: "Shadow", kelvin: 7500, glyph: <Shade /> },
];

export function SubmenuWhiteBalance({ settings, update }: Props) {
  const current = options.find((o) => o.id === settings.balance) ?? options[0];

  return (
    <Submenu
      title="White Balance"
      className="wb"
      back={() => update({ submenu: false, balance: null })}
      auto={{ on: current === options[0], select: () => update({ balance: "auto" }) }}
    >
      <p className="wb-readout" data-auto={!current.kelvin || undefined}>
        {current.kelvin ?? 0}
        <sup>K</sup>
      </p>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="wb-option"
          data-on={id === current.id || undefined}
          style={{ left: 60 + 55 * i }}
          aria-label={label}
          onClick={() => update({ balance: id })}
        >
          <span className="wb-glyph">{glyph}</span>
          <span className="wb-radio" />
        </button>
      ))}
    </Submenu>
  );
}
