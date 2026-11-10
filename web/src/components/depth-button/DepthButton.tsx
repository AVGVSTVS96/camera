import { useProfile } from "../../profile.ts";
import { DepthOff, DepthOn } from "./icons.tsx";
import "./depth-button.css";

export function DepthButton({ on, toggle }: { on: boolean; toggle: () => void }) {
  const { depthSlash } = useProfile();
  const slash = on || depthSlash;

  return (
    <button
      className="depth-button round lead"
      aria-label="Depth"
      aria-pressed={on}
      data-on={on || undefined}
      data-slash={slash || undefined}
      onClick={toggle}
    >
      {slash ? <DepthOn /> : <DepthOff />}
    </button>
  );
}
