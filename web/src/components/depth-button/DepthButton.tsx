import { DepthOff } from "../../icons.tsx";
import "./depth-button.css";

export function DepthButton() {
  return (
    <button className="depth-button round lead" aria-label="Depth">
      <DepthOff />
    </button>
  );
}
