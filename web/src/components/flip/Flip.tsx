import type { Props } from "../../state.ts";
import "./flip.css";
import { FlipGlyph } from "./icons.tsx";

export function Flip({ settings, update }: Props) {
  const flip = () => {
    const facing = settings.facing === "front" ? "back" : "front";

    update({ facing, night: facing === "front" ? "off" : "auto" });
  };

  return (
    <button className="flip" aria-label="Camera Chooser" onClick={flip}>
      <FlipGlyph />
    </button>
  );
}
