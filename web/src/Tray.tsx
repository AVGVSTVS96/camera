import type { ReactNode } from "react";
import type { Update } from "./Camera.tsx";
import {
  Aspect,
  BoltAuto,
  DepthOff,
  Exposure,
  Framing,
  LiveOff,
  Moon,
  Scene,
  Styles,
  TimerOff,
  Tone,
} from "./icons.tsx";
import { useProfile } from "./profile.ts";
import type { Settings } from "./state.ts";

function Resolution() {
  const [name, detail] = useProfile().photoFormat.split(" ");

  return (
    <span className="badge">
      <b>{name}</b>
      <b>{detail}</b>
    </span>
  );
}

const controls: [string, () => ReactNode, boolean?][] = [
  ["Flash", BoltAuto],
  ["Live", LiveOff],
  ["Aspect", Aspect],
  ["Timer", TimerOff],
  ["Exposure", Exposure],
  ["Styles", Styles],
  ["Depth", DepthOff],
  ["Night Mode", Moon, true],
  ["Resolution", Resolution],
  ["Framing", Framing],
  ["Scene", Scene],
  ["Tone", Tone, true],
];

export function Tray({ update }: { settings: Settings; update: Update }) {
  return (
    <>
      <div className="tray-backdrop" onClick={() => update({ tray: false })} />
      <section className="tray" aria-label="Camera controls">
        <div className="handle" />
        <div className="tray-grid">
          {controls.map(([label, Icon, on]) => (
            <button key={label} data-on={on || undefined}>
              <span className="knob">
                <Icon />
              </span>
              {label.toUpperCase()}
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
