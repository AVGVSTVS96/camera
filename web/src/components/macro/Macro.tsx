import type { Props } from "../../state.ts";
import { MacroGlyph } from "./icons.tsx";

export function Macro({ settings, update }: Props) {
  return (
    <button
      className="glass round lead"
      data-on={settings.macro || undefined}
      aria-label="Macro"
      onClick={() => update({ macro: !settings.macro })}
    >
      <MacroGlyph />
    </button>
  );
}
