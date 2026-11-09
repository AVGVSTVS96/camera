import type { Flash, Props } from "../../state.ts";
import { Bolt } from "../controls-panel/icons.tsx";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-flash.css";

const options: { id: Flash; label: string; name: string }[] = [
  { id: "auto", label: "Automatic", name: "Auto" },
  { id: "on", label: "On", name: "On" },
  { id: "off", label: "Off", name: "Off" },
];

export function SubmenuFlash({ settings, update }: Props) {
  const current = options.find((o) => o.id === settings.flashMenu) ?? options[0];

  return (
    <Submenu title="Flash" className="flash" back={() => update({ submenu: false, flashMenu: null })}>
      <output className="flash-value">{current.name}</output>
      {options.map(({ id, label }, i) => (
        <button
          key={id}
          className="flash-option"
          data-on={id === current.id || undefined}
          style={{ left: 112.5 + 75 * i }}
          aria-label={label}
          onClick={() => update({ flashMenu: id })}
        >
          <Bolt flash={id} />
        </button>
      ))}
    </Submenu>
  );
}
