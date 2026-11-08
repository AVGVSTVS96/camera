import type { Props } from "../../state.ts";
import "./flip.css";
import { FlipGlyph } from "./icons.tsx";

export function Flip({ settings, update }: Props) {
  return (
    <button
      className="flip"
      aria-label="Camera Chooser"
      onClick={() => update({ facing: settings.facing === "front" ? "back" : "front" })}
    >
      <FlipGlyph />
    </button>
  );
}
