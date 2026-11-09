import { back, type Props } from "../../state.ts";
import { Submenu } from "../submenu/Submenu.tsx";
import { Off, Seconds } from "./icons.tsx";
import "./submenu-timer.css";

const options = [null, 3, 5, 10];

const nameOf = (seconds: number | null) => (seconds ? `${seconds}s` : "Off");

export function SubmenuTimer({ settings, update }: Props) {
  return (
    <Submenu title="Timer" className="timer" back={() => update({ ...back, tray: !settings.timer })}>
      <output className="timer-value">{nameOf(settings.timer)}</output>
      {options.map((seconds, i) => (
        <button
          key={nameOf(seconds)}
          className="timer-option"
          data-on={seconds === settings.timer || undefined}
          style={{ left: 112.67 + 56.33 * i }}
          aria-label={nameOf(seconds)}
          onClick={() => update({ timer: seconds })}
        >
          {seconds ? <Seconds value={seconds} /> : <Off />}
        </button>
      ))}
    </Submenu>
  );
}
