import type { Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { Bracket } from "./icons.tsx";
import "./submenu-aspect-ratio.css";

const options = [
  { ratio: "4:3", label: "4 by 3" },
  { ratio: "16:9", label: "16 by 9" },
  { ratio: "1:1", label: "Square" },
];

export function SubmenuAspectRatio({ settings, update }: Props) {
  return (
    <Submenu title="Aspect" className="aspect" back={() => update({ submenu: false, aspect: null })}>
      <p className="aspect-readout">{settings.aspect}</p>
      {options.map(({ ratio, label }, i) => (
        <button
          key={ratio}
          className="aspect-option"
          data-on={ratio === settings.aspect || undefined}
          style={{ left: 112.6 + 75 * i }}
          aria-label={label}
          onClick={() => update({ aspect: ratio, square: ratio === "1:1" })}
        >
          <Bracket ratio={ratio} />
        </button>
      ))}
    </Submenu>
  );
}
