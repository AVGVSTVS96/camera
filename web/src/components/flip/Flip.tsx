import type { Props } from "../../state.ts";
import { FlipGlyph } from "./icons.tsx";

export function Flip({ settings, update }: Props) {
  return (
    <button
      className="glass round trail"
      aria-label="Switch camera"
      onClick={() => update({ facing: settings.facing === "front" ? "back" : "front" })}
    >
      <FlipGlyph />
    </button>
  );
}
