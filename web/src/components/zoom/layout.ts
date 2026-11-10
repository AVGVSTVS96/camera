import type { Settings } from "../../state.ts";

const outer = { reach: 132, radius: 258, perDoubling: 34 };
const inner = { reach: 192.67, radius: 365.33 };

const places = {
  "outer-portrait": {
    vertical: false,
    closed: 446,
    submenu: 344,
    square: 338.33,
    cross: 233,
    lone: 34,
    along: [1, 0],
    into: [0, -1],
    ...outer,
  },
  "outer-landscape": {
    vertical: true,
    closed: 232,
    submenu: 334,
    square: 339.67,
    cross: 233,
    lone: 34,
    along: [0, 1],
    into: [1, 0],
    ...outer,
  },
  "inner-portrait": {
    vertical: false,
    closed: 232,
    submenu: 334,
    square: 373.33,
    cross: 334.5,
    lone: 635,
    along: [-1, 0],
    into: [0, 1],
    perDoubling: 85,
    ...inner,
  },
  "inner-landscape": {
    vertical: true,
    closed: 232,
    submenu: 334,
    square: 373.33,
    cross: 334.5,
    lone: 34,
    along: [0, 1],
    into: [1, 0],
    perDoubling: 36,
    ...inner,
  },
} as const;

export const slot = 39;

export function layout(s: Settings, duo: boolean) {
  const p = places[`${s.display}-${s.orientation}`];
  const [dx, dy] = p.into;
  const closed = duo ? 432 : p.closed;
  const depth = s.submenu ? (s.aspect === "1:1" ? p.square : p.submenu) : closed;
  const point = (along: number, out: number) => (p.vertical ? [out, along] : [along, out]);
  const edge = closed - 20 * (p.vertical ? dx : dy);
  const [ax, ay] = point(p.cross, edge + p.reach * (p.vertical ? dx : dy));
  const [cx, cy] = [ax - dx * p.radius, ay - dy * p.radius];

  return {
    inner: s.display === "inner",
    radius: p.radius,
    centre: { x: ax - dx * p.radius, y: ay - dy * p.radius },
    x: p.vertical ? depth : p.cross,
    y: p.vertical ? p.cross : depth,
    lone: p.lone,
    perDoubling: p.perDoubling,
    along: p.along,
    vertical: p.vertical,
    into: p.into,
    clip:
      dx + dy < 0
        ? `inset(0 0 calc(100% - ${edge}px) 0)`
        : dy > 0
          ? `inset(${edge}px 0 0 0)`
          : `inset(0 0 0 ${edge}px)`,
    turn: s.display === "inner" && !p.vertical ? 180 : 0,
    apex: { x: ax, y: ay },
    dial: `M${cx - p.radius} ${cy}a${p.radius} ${p.radius} 0 1 0 ${2 * p.radius} 0a${p.radius} ${p.radius} 0 1 0 ${-2 * p.radius} 0Z`,
  };
}
