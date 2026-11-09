import { back, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-resolution.css";

const options = [24, 48] as const;

export function SubmenuResolution({ settings, update }: Props) {
  const current = settings.resolution;

  return (
    <Submenu title="Resolution" className="resolution" back={() => update(back)}>
      <output className="resolution-value">{current} MP</output>
      {options.map((mp, i) => (
        <button
          key={mp}
          className="resolution-option"
          data-on={mp === current || undefined}
          style={{ left: i ? 225 : 112.67, width: i ? 112.67 : 112.33 }}
          aria-label={`${mp} megapixels`}
          onClick={() => update({ resolution: mp })}
        >
          {mp} MP
        </button>
      ))}
    </Submenu>
  );
}
