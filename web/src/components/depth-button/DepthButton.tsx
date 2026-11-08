import { DepthOff } from "../../icons.tsx";
import "./depth-button.css";

export function DepthButton() {
  return (
    <button className="glass round lead dim" aria-label="Depth">
      <DepthOff />
    </button>
  );
}
