import type { ReactNode } from "react";
import type { Flash, Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { Automatic, Off, On } from "./icons.tsx";
import "./submenu-flash.css";

const options: { id: Flash; label: string; name: string; glyph: ReactNode }[] = [
  { id: "auto", label: "Automatic", name: "Auto", glyph: <Automatic /> },
  { id: "on", label: "On", name: "On", glyph: <On /> },
  { id: "off", label: "Off", name: "Off", glyph: <Off /> },
];

export function SubmenuFlash({ settings, update }: Props) {
  const current = options.find((o) => o.id === settings.flashMenu) ?? options[0];

  return (
    <Submenu title="Flash" className="flash" back={() => update({ submenu: false, flashMenu: null })}>
      <output className="flash-value" data-auto={current.id === "auto" || undefined}>
        {current.name}
      </output>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="flash-option"
          data-on={id === current.id || undefined}
          style={{ left: 112.5 + 75 * i }}
          aria-label={label}
          onClick={() => update({ flashMenu: id })}
        >
          {glyph}
        </button>
      ))}
    </Submenu>
  );
}
