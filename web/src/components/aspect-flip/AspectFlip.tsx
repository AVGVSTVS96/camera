import type { Props } from "../../state.ts";
import { LandscapeGlyph, PortraitGlyph } from "./icons.tsx";
import "./aspect-flip.css";

export function AspectFlip({ settings, update }: Props) {
  const { display, orientation, mode, facing, submenu, recording, tray } = settings;

  if (facing !== "front" || (mode !== "cinematic" && mode !== "video") || recording || tray) return null;

  const landscape = orientation === "landscape";
  const portraitGlyph = landscape && !(display === "inner" && mode === "cinematic");

  return (
    <button
      className="aspect-flip"
      data-open={submenu !== null || undefined}
      aria-label={`Change Aspect Ratio to ${portraitGlyph ? "Portrait" : "Landscape"}`}
      onClick={() => update({ orientation: landscape ? "portrait" : "landscape" })}
    >
      {portraitGlyph ? <PortraitGlyph /> : <LandscapeGlyph />}
    </button>
  );
}
