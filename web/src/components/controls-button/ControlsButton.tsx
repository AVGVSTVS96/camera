import { More } from "./icons.tsx";

export function ControlsButton({ movie, open }: { movie: boolean; open: () => void }) {
  return (
    <button className="glass round trail" data-on={!movie || undefined} aria-label="Camera controls" onClick={open}>
      <More />
    </button>
  );
}
