import { back, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-video-resolution.css";

const options = ["HD", "4K"] as const;

export function SubmenuVideoResolution({ settings, update }: Props) {
  const { videoResolution: resolution } = settings;

  return (
    <Submenu title="Resolution" className="vr" back={() => update(back)}>
      <output className="vr-value">{resolution}</output>
      {options.map((name, i) => (
        <button
          key={name}
          className="vr-option"
          data-on={name === resolution || undefined}
          style={{ left: 112.67 + 112.33 * i }}
          onClick={() => update({ videoResolution: name })}
        >
          {name}
        </button>
      ))}
    </Submenu>
  );
}
