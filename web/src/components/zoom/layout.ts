import type { Settings } from "../../state.ts";

const outer = { reach: 132, radius: 258 };
const inner = { reach: 195, radius: 383 };

const places = {
  "outer-portrait": {
    vertical: false,
    closed: 446,
    submenu: 344,
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
    cross: 334.5,
    lone: 635,
    along: [-1, 0],
    into: [0, 1],
    ...inner,
  },
  "inner-landscape": {
    vertical: true,
    closed: 232,
    submenu: 334,
    cross: 334.5,
    lone: 34,
    along: [0, 1],
    into: [1, 0],
    ...inner,
  },
} as const;

export const slot = 39;

export function layout(s: Settings, count: number) {
  const p = places[`${s.display}-${s.orientation}`];
  const [dx, dy] = p.into;
  const depth = s.submenu ? p.submenu : p.closed;
  const across = count === 1 ? p.lone : p.cross;
  const point = (along: number, out: number) => (p.vertical ? [out, along] : [along, out]);
  const edge = p.closed - 20 * (p.vertical ? dx : dy);
  const w = Math.sqrt(p.radius ** 2 - (p.radius - p.reach) ** 2);
  const [x1, y1] = point(p.cross - w * (p.vertical ? 1 : dy * -1), edge);
  const [x2, y2] = point(p.cross + w * (p.vertical ? 1 : dy * -1), edge);
  const [ax, ay] = point(p.cross, edge + p.reach * (p.vertical ? dx : dy));

  return {
    x: p.vertical ? depth : across,
    y: p.vertical ? across : depth,
    along: p.along,
    vertical: p.vertical,
    into: p.into,
    turn: s.display === "inner" && !p.vertical ? 180 : 0,
    apex: { x: ax, y: ay },
    dial: `M${x1} ${y1}A${p.radius} ${p.radius} 0 0 1 ${x2} ${y2}Z`,
  };
}
