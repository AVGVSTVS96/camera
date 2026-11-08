import "./countdown.css";
import type { Settings } from "../../state.ts";

export function Countdown({ settings }: { settings: Pick<Settings, "timer" | "timerMenu"> }) {
  const { timer, timerMenu } = settings;

  if (!timer) return null;

  return (
    <div className="countdown" data-menu={timerMenu || undefined} data-digits={String(timer).length}>
      <span>{timer}</span>
    </div>
  );
}
