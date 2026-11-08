import { DepthOff, DepthOn } from "./icons.tsx";
import "./depth-button.css";

export function DepthButton({ on }: { on: boolean }) {
  return (
    <button className="depth-button round lead" aria-label="Depth" aria-pressed={on} data-on={on || undefined}>
      {on ? <DepthOn /> : <DepthOff />}
    </button>
  );
}
