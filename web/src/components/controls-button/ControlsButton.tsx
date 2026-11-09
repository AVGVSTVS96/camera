import "./controls-button.css";
import { More } from "./icons.tsx";

export function ControlsButton({ open }: { open: (at: { x: number; y: number }) => void }) {
  return (
    <button
      className="controls-button trail"
      aria-label="Camera Controls"
      onClick={({ currentTarget }) => {
        const { x, y, width, height } = currentTarget.getBoundingClientRect();
        open({ x: x + width / 2, y: y + height / 2 });
      }}
    >
      <More />
    </button>
  );
}
