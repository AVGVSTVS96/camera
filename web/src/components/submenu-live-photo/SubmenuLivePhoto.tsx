import type { ReactNode } from "react";
import { back, type LivePhoto, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { Auto, Off, On } from "./icons.tsx";
import "./submenu-live-photo.css";

const options: { id: LivePhoto; label: string; glyph: ReactNode }[] = [
  { id: "auto", label: "Automatic", glyph: <Auto /> },
  { id: "on", label: "On", glyph: <On /> },
  { id: "off", label: "Off", glyph: <Off /> },
];

const values: Record<LivePhoto, string> = { auto: "Auto", on: "On", off: "Off" };

export function SubmenuLivePhoto({ settings, update }: Props) {
  const { live } = settings;

  return (
    <Submenu title="Live" className="live-photo" back={() => update(back)}>
      <output className="live-photo-value">{values[live]}</output>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="live-photo-option"
          data-on={id === live || undefined}
          style={{ left: 112.67 + 75 * i }}
          aria-label={label}
          onClick={() => update({ live: id })}
        >
          {glyph}
        </button>
      ))}
    </Submenu>
  );
}
