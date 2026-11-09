import "./countdown.css";
import type { Settings } from "../../state.ts";

export function Countdown({ settings }: { settings: Settings }) {
  const { timer, countdown, submenu } = settings;
  const digits = countdown || timer;

  if (!digits) return null;

  return (
    <div
      className="countdown"
      data-menu={submenu === "Timer" || undefined}
      data-running={countdown > 0 || undefined}
      data-digits={String(timer ?? digits).length}
    >
      <span key={digits}>{digits}</span>
    </div>
  );
}
