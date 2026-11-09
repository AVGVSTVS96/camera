import type { Settings } from "../../state.ts";

interface Depths {
  closed: number;
  submenu: number;
  square: number;
}

const depths = {
  "outer-portrait": { closed: 446, submenu: 344, square: 338.3 },
  "inner-portrait": { closed: 232, submenu: 334, square: 373.3 },
  "inner-landscape": { closed: 232, submenu: 334, square: 373.3 },
  "outer-landscape": { closed: 232, submenu: 334, square: 339.7 },
} satisfies Record<string, Depths>;

export interface Layout {
  x: number;
  y: number;
  along: readonly [number, number];
  badge?: { x: number; y: number };
}

export function layout(s: Settings): Layout | undefined {
  const context = `${s.display}-${s.orientation}` as const;
  const d = depths[context];
  const square = s.submenu !== null && s.aspect === "1:1";
  const depth = square ? d.square : s.submenu ? d.submenu : d.closed;
  const nudge = square ? 16 : 0;

  if (s.mode !== "photo" && s.mode !== "portrait") return undefined;

  if (s.mode === "photo") {
    if (context === "inner-portrait") return { x: 44, y: depth, along: [0, 0] };

    if (!s.submenu) return undefined;

    return { x: depth, y: s.display === "inner" ? 625 : 422, along: [0, 0] };
  }

  switch (context) {
    case "outer-portrait":
      return { x: 233, y: depth, along: [1, 0], badge: { x: 233, y: depth - 43 } };
    case "inner-portrait":
      return { x: 334.5, y: depth, along: [-1, 0], badge: { x: 334.5, y: depth + 43 } };
    case "inner-landscape":
      return { x: depth, y: 334.5, along: [0, 1], badge: { x: 656 + nudge, y: 642 } };
    default:
      return { x: depth, y: 233, along: [0, 1], badge: { x: 520.7 + nudge, y: 439 } };
  }
}

export const neighbours = [
  { gap: 47.3, size: 20.77, alpha: 0.862, ring: 21.42 },
  { gap: 90.8, size: 18.86, alpha: 0.735, ring: 19.45 },
  { gap: 130.6, size: 17.7, alpha: 0.619, ring: 18.26 },
  { gap: 166.7, size: 17.06, alpha: 0.514, ring: 17.6 },
  { gap: 199, size: 16.75, alpha: 0.42, ring: 17.28 },
];
