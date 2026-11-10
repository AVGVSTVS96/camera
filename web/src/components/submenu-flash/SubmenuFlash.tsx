import type { ReactNode } from "react";
import { back, type Flash, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { Automatic, Off, On } from "./icons.tsx";
import "./submenu-flash.css";

const options: { id: Flash; label: string; name: string; glyph: ReactNode }[] = [
  { id: "auto", label: "Automatic", name: "Auto", glyph: <Automatic /> },
  { id: "on", label: "On", name: "On", glyph: <On /> },
  { id: "off", label: "Off", name: "Off", glyph: <Off /> },
];

export function SubmenuFlash({ settings, update }: Props) {
  const current = options.find((o) => o.id === settings.flash) ?? options[0];

  return (
    <Submenu title="Flash" className="flash" back={() => update(back)}>
      <output className="flash-value" data-word={current.id}>
        {current.name}
      </output>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="flash-option"
          data-on={id === current.id || undefined}
          style={{ left: 112.5 + 75 * i }}
          aria-label={label}
          onClick={() => update({ flash: id })}
        >
          {glyph}
        </button>
      ))}
    </Submenu>
  );
}
