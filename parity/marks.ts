import type { PNG } from "pngjs";
import { placed, walk, type Rect, type Tree } from "./tree.ts";

export interface Mark {
  element: string;
  box: Rect;
  score: number;
  shift: [number, number];
  extra?: true;
}

const floor = 16;
const edge = 64;
const join = 4;
const margin = 2;
const reach = 3;
const slip = 0.1;

interface Field {
  gx: Float32Array;
  gy: Float32Array;
  mag: Float32Array;
}

const index = (i: number, length: number) => Math.min(length - 1, Math.max(0, i));

function blur(values: Float32Array, width: number, height: number, radius: number) {
  const size = 2 * radius + 1;
  const rows = new Float32Array(values.length);
  const result = new Float32Array(values.length);

  for (let y = 0; y < height; y++) {
    const row = y * width;
    let sum = 0;

    for (let i = -radius; i <= radius; i++) sum += values[row + index(i, width)];

    for (let x = 0; x < width; x++) {
      rows[row + x] = sum / size;
      sum += values[row + index(x + radius + 1, width)] - values[row + index(x - radius, width)];
    }
  }

  const sums = new Float32Array(width);

  for (let i = -radius; i <= radius; i++) {
    const row = index(i, height) * width;

    for (let x = 0; x < width; x++) sums[x] += rows[row + x];
  }

  for (let y = 0; y < height; y++) {
    const next = index(y + radius + 1, height) * width;
    const last = index(y - radius, height) * width;

    for (let x = 0; x < width; x++) {
      result[y * width + x] = sums[x] / size;
      sums[x] += rows[next + x] - rows[last + x];
    }
  }

  return result;
}

function field(image: PNG, keep: Uint8Array, scale: number): Field {
  const { width, height, data } = image;
  const raw = new Float32Array(width * height);

  for (let p = 0; p < raw.length; p++) raw[p] = 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];

  const radius = Math.max(1, Math.round(scale / 3));
  const lum = blur(blur(raw, width, height, radius), width, height, radius);
  const gx = new Float32Array(lum.length);
  const gy = new Float32Array(lum.length);
  const mag = new Float32Array(lum.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const p = y * width + x;

      if (!keep[p]) continue;
      const nw = lum[p - width - 1];
      const ne = lum[p - width + 1];
      const sw = lum[p + width - 1];
      const se = lum[p + width + 1];
      const dx = ne + 2 * lum[p + 1] + se - nw - 2 * lum[p - 1] - sw;
      const dy = sw + 2 * lum[p + width] + se - nw - 2 * lum[p - width] - ne;
      const m = Math.sqrt(dx * dx + dy * dy);

      if (m < floor) continue;
      gx[p] = dx;
      gy[p] = dy;
      mag[p] = m;
    }
  }

  return { gx, gy, mag };
}

interface Grid {
  cw: number;
  ch: number;
  cell: (p: number) => number;
}

function grid(width: number, height: number, scale: number): Grid {
  const cw = Math.ceil(width / scale);

  return {
    cw,
    ch: Math.ceil(height / scale),
    cell: (p) => Math.floor(Math.floor(p / width) / scale) * cw + Math.floor((p % width) / scale),
  };
}

function inked({ mag }: Field, { cw, ch, cell }: Grid) {
  const cells = new Uint8Array(cw * ch);

  for (let p = 0; p < mag.length; p++) if (mag[p] >= edge) cells[cell(p)] = 1;

  return cells;
}

function* around(c: number, by: number, { cw, ch }: Grid) {
  const x = c % cw;
  const y = Math.floor(c / cw);

  for (let ny = Math.max(0, y - by); ny <= Math.min(ch - 1, y + by); ny++) {
    for (let nx = Math.max(0, x - by); nx <= Math.min(cw - 1, x + by); nx++) yield ny * cw + nx;
  }
}

function groups(cells: Uint8Array, g: Grid) {
  const seen = new Uint8Array(cells.length);
  const found: number[][] = [];

  for (let start = 0; start < cells.length; start++) {
    if (!cells[start] || seen[start]) continue;
    const members = [start];
    seen[start] = 1;

    for (let i = 0; i < members.length; i++) {
      for (const n of around(members[i], join, g)) {
        if (cells[n] && !seen[n]) {
          seen[n] = 1;
          members.push(n);
        }
      }
    }

    if (members.length > 1) found.push(members);
  }

  return found;
}

function bounds(members: number[], { cw }: Grid): Rect {
  const xs = members.map((c) => c % cw);
  const ys = members.map((c) => Math.floor(c / cw));
  const x = Math.min(...xs);
  const y = Math.min(...ys);

  return { x, y, w: Math.max(...xs) - x + 1, h: Math.max(...ys) - y + 1 };
}

function match(apple: Field, ours: Field, pixels: Int32Array, width: number, height: number, scale: number) {
  const xs = pixels.map((p) => p % width);
  const ys = pixels.map((p) => Math.floor(p / width));

  const at = (dx: number, dy: number) => {
    let error = 0;
    let total = 0;

    for (let i = 0; i < pixels.length; i++) {
      const p = pixels[i];
      const x = xs[i] + dx;
      const y = ys[i] + dy;
      const q = x < 0 || y < 0 || x >= width || y >= height ? -1 : p + dy * width + dx;
      const a = apple.mag[p];
      const o = q < 0 ? 0 : ours.mag[q];

      if (!a && !o) continue;
      total += a + o;
      error += o && a ? Math.sqrt((apple.gx[p] - ours.gx[q]) ** 2 + (apple.gy[p] - ours.gy[q]) ** 2) : a + o;
    }

    const likeness = total ? 1 - error / total : 1;

    return likeness * Math.max(0, 1 - (slip * Math.max(0, Math.hypot(dx, dy) - 1)) / scale);
  };

  let best = { score: at(0, 0), dx: 0, dy: 0 };

  const consider = (dx: number, dy: number) => {
    const score = at(dx, dy);

    if (score > best.score) best = { score, dx, dy };
  };

  for (let dy = -reach; dy <= reach; dy++) for (let dx = -reach; dx <= reach; dx++) consider(dx * scale, dy * scale);

  const { dx: cx, dy: cy } = best;

  for (let dy = 1 - scale; dy < scale; dy++)
    for (let dx = 1 - scale; dx < scale; dx++) if (dx || dy) consider(cx + dx, cy + dy);

  const shift: [number, number] = [best.dx / scale, best.dy / scale];

  return { score: best.score, shift };
}

function names(tree: Tree) {
  const named = [
    ...tree.ax.flatMap((e) =>
      placed(e.frame) && (e.identifier || e.label)
        ? [{ frame: e.frame, name: [e.identifier, e.label && `"${e.label}"`].filter(Boolean).join(" ") }]
        : [],
    ),
    ...[...walk(tree.views)].flatMap(([v]) =>
      v.text || v.image
        ? [{ frame: v.frame, name: `${v.class} ${v.text ? `"${v.text}"` : (v.image ?? "")}`.trim() }]
        : [],
    ),
  ];

  return (box: Rect) =>
    named
      .filter(
        ({ frame: f }) =>
          box.x >= f.x - margin &&
          box.y >= f.y - margin &&
          box.x + box.w <= f.x + f.w + margin &&
          box.y + box.h <= f.y + f.h + margin,
      )
      .toSorted((a, b) => a.frame.w * a.frame.h - b.frame.w * b.frame.h)[0]?.name ?? "";
}

const round = (n: number) => Math.round(n * 100) / 100;

export function marks(apple: PNG, ours: PNG, counted: Uint8Array, scale: number, tree: Tree): Mark[] {
  const { width, height } = apple;
  const g = grid(width, height, scale);
  const a = field(apple, counted, scale);
  const o = field(ours, counted, scale);
  const appleCells = inked(a, g);
  const oursCells = inked(o, g);
  const name = names(tree);
  const found = groups(appleCells, g);
  const owner = new Int32Array(appleCells.length).fill(-1);

  found.forEach((members, k) => {
    for (const c of members) for (const n of around(c, margin, g)) if (owner[n] < 0) owner[n] = k;
  });

  const pixels = found.map((): number[] => []);

  for (let p = 0; p < a.mag.length; p++) {
    const k = owner[g.cell(p)];

    if (k >= 0) pixels[k].push(p);
  }

  const scored = found.map((members, k): Mark => {
    const box = bounds(members, g);
    const { score, shift } = match(a, o, Int32Array.from(pixels[k]), width, height, scale);

    return { element: name(box), box, score: round(score * 100), shift: [round(shift[0]), round(shift[1])] };
  });

  const extras = groups(
    appleCells.map((v, i) => v | oursCells[i]),
    g,
  )
    .filter((members) => !members.some((c) => appleCells[c]))
    .map((members): Mark => {
      const box = bounds(members, g);

      return {
        element: `extra, Apple draws nothing here ${name(box)}`.trim(),
        box,
        score: 0,
        shift: [0, 0],
        extra: true,
      };
    });

  return [...scored, ...extras];
}
