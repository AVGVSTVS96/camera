import "./countdown.css";
import type { Settings } from "../../state.ts";

export function Countdown({ settings }: { settings: Settings }) {
  const { timer, submenu } = settings;

  if (!timer) return null;

  return (
    <div className="countdown" data-menu={submenu === "Timer" || undefined} data-digits={String(timer).length}>
      <span>{timer}</span>
    </div>
  );
}
