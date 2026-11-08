import type { ReactNode } from "react";
import type { Props } from "../../state.ts";
import { Awb, Bulb, Chevron, Cloud, Shade, Sun, Tube, Unset } from "./icons.tsx";
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
  const auto = current === options[0];

  return (
    <section className="submenu wb" aria-label="White Balance">
      <button className="wb-round wb-back" aria-label="Back" onClick={() => update({ submenu: false, balance: null })}>
        <Chevron />
      </button>
      <button
        className="wb-round wb-auto"
        data-on={auto || undefined}
        aria-label="Auto"
        onClick={() => update({ balance: "auto" })}
      >
        A
      </button>
      <h2 className="wb-title">WHITE BALANCE</h2>
      <p className="wb-readout">
        {current.kelvin ?? <Unset />}
        <sup>K</sup>
      </p>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="wb-option"
          data-on={id === current.id || undefined}
          style={{ left: 58.5 + 55 * i }}
          aria-label={label}
          onClick={() => update({ balance: id })}
        >
          <span className="wb-glyph">{glyph}</span>
          <span className="wb-radio" />
        </button>
      ))}
    </section>
  );
}
