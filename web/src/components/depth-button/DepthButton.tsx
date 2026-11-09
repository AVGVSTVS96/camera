import { DepthOff, DepthOn } from "./icons.tsx";
import "./depth-button.css";

export function DepthButton({ on, toggle }: { on: boolean; toggle: () => void }) {
  return (
    <button
      className="depth-button round lead"
      aria-label="Depth"
      aria-pressed={on}
      data-on={on || undefined}
      onClick={toggle}
    >
      {on ? <DepthOn /> : <DepthOff />}
    </button>
  );
}
