import type { ReactNode } from "react";
import type { LivePhoto, Props } from "../../state.ts";
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
  const { livePhoto } = settings;

  if (!livePhoto) return null;

  return (
    <Submenu title="Live" className="live-photo" back={() => update({ submenu: false, livePhoto: null })}>
      <output className="live-photo-value">{values[livePhoto]}</output>
      {options.map(({ id, label, glyph }, i) => (
        <button
          key={id}
          className="live-photo-option"
          data-on={id === livePhoto || undefined}
          style={{ left: 112.67 + 75 * i }}
          aria-label={label}
          onClick={() => update({ livePhoto: id, live: id === "on" })}
        >
          {glyph}
        </button>
      ))}
    </Submenu>
  );
}
