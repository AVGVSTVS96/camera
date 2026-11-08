import { DepthOff } from "../../icons.tsx";
import "./depth-button.css";

export function DepthButton() {
  return (
    <button className="depth-button lead" aria-label="Depth">
      <DepthOff />
    </button>
  );
}
