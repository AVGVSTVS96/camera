import "./controls-button.css";
import { More } from "./icons.tsx";

export function ControlsButton({ open }: { open: () => void }) {
  return (
    <button className="controls-button trail" aria-label="Camera Controls" onClick={open}>
      <More />
    </button>
  );
}
