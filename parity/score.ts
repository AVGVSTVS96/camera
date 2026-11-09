import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { marks, type Mark } from "./marks.ts";
import { out, specs } from "./paths.ts";
import { read, scene } from "./scene.ts";
import type { State } from "./states.ts";
import { tree, type Rect } from "./tree.ts";

const uiThreshold = 16;

export interface Score {
  score: number;
  pixels: number;
  elements: number | null;
  compared: number;
  mismatched: number;
}

export interface Result extends Score {
  id: string;
  profile: string;
  mode: string;
  display: string;
  orientation: string;
  components: Record<string, Score & { regions: Rect[] }>;
  marks: (Mark & { components: string[] })[];
  apple: string;
  ours: string;
  diff: string;
  time: number;
}

export const mean = (scores: number[]) =>
  Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length || 1)) * 100) / 100;

const centered = (box: Rect, r: Rect) => {
  const x = box.x + box.w / 2;
  const y = box.y + box.h / 2;

  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
};

const percent = (compared: number, mismatched: number) =>
  compared ? Math.round((1 - mismatched / compared) * 10000) / 100 : 100;

function differs(a: Buffer, b: Buffer, i: number) {
  return Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > uiThreshold;
}

function mask(rects: Rect[], scale: number, width: number, height: number) {
  const inside = new Uint8Array(width * height);

  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x * scale));
    const x1 = Math.min(width, Math.ceil((r.x + r.w) * scale));

    for (let y = Math.max(0, Math.floor(r.y * scale)); y < Math.min(height, Math.ceil((r.y + r.h) * scale)); y++) {
      inside.fill(1, y * width + x0, y * width + x1);
    }
  }

  return inside;
}

function shrink(image: PNG, by: number) {
  const small = new PNG({ width: Math.floor(image.width / by), height: Math.floor(image.height / by) });

  for (let y = 0; y < small.height; y++) {
    for (let x = 0; x < small.width; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;

        for (let dy = 0; dy < by; dy++) {
          for (let dx = 0; dx < by; dx++) sum += image.data[((y * by + dy) * image.width + x * by + dx) * 4 + c];
        }

        small.data[(y * small.width + x) * 4 + c] = sum / (by * by);
      }
    }
  }

  return small;
}

export async function compare(
  state: State,
  oursPath: string,
  regions: Record<string, Rect[]>,
  dir = out,
): Promise<Result> {
  const apple = await read(state.image);
  const ours = await read(oursPath);
  const { plate: platePath, ignore } = await scene(state);
  const plate = await read(platePath);
  const { width, height } = apple;
  const scale = state.screen.scale;

  if (ours.width !== width || ours.height !== height) {
    throw new Error(`${state.id}: ours is ${ours.width}×${ours.height}, Apple's is ${width}×${height}`);
  }

  const oursSmall = shrink(ours, scale);
  const counted = new Uint8Array(width * height);
  const skipped = mask(ignore, scale, width, height);

  for (let p = 0; p < counted.length; p++) {
    const i = p * 4;

    if (!skipped[p] && (differs(apple.data, plate.data, i) || differs(ours.data, plate.data, i))) counted[p] = 1;
    else apple.data.copy(ours.data, i, i, i + 4);
  }

  const diff = new PNG({ width, height });
  pixelmatch(apple.data, ours.data, diff.data, width, height, { threshold: 0.1, alpha: 0.25 });
  const wrong = (p: number) => diff.data[p * 4] === 255 && diff.data[p * 4 + 1] === 0 && diff.data[p * 4 + 2] === 0;
  const diffPath = join(dir, "diff", `${state.id}.png`);
  await Bun.write(diffPath, PNG.sync.write(diff));
  const small = { apple: shrink(apple, scale), ours: oursSmall, diff: shrink(diff, scale) };
  await Promise.all(
    Object.entries(small).map(([kind, image]) =>
      Bun.write(join(dir, "small", `${state.id}-${kind}.png`), PNG.sync.write(image)),
    ),
  );

  const found = marks(apple, ours, counted, scale, await tree(state)).map((mark) => {
    const components = Object.entries(regions).flatMap(([name, rects]) =>
      rects.some((r) => centered(mark.box, r)) ? [name] : [],
    );

    return { ...mark, element: mark.element || `${components.join(", ") || "screen"} (no AX element)`, components };
  });

  const tally = (inside?: Uint8Array, component?: string) => {
    let compared = 0;
    let mismatched = 0;

    for (let p = 0; p < counted.length; p++) {
      if (!counted[p] || (inside && !inside[p])) continue;
      compared++;

      if (wrong(p)) mismatched++;
    }

    const pixels = percent(compared, mismatched);
    const scores = found.flatMap((m) => (!component || m.components.includes(component) ? [m.score] : []));
    const elements = scores.length ? mean(scores) : null;

    return {
      score: elements === null ? pixels : Math.round(Math.sqrt(pixels * elements) * 100) / 100,
      pixels,
      elements,
      compared,
      mismatched,
    };
  };

  return {
    id: state.id,
    profile: state.profile,
    mode: state.mode,
    display: state.display,
    orientation: state.orientation,
    ...tally(),
    components: Object.fromEntries(
      Object.entries(regions).map(([name, rects]) => [
        name,
        { ...tally(mask(rects, scale, width, height), name), regions: rects },
      ]),
    ),
    apple: state.image,
    ours: oursPath,
    diff: diffPath,
    marks: found.toSorted((a, b) => a.score - b.score),
    time: Date.now(),
  };
}

export const index: Record<string, { about: string; states: Record<string, Rect[]> }> = await Bun.file(
  join(specs, "index.json"),
).json();

export function regionsOf(state: State): Record<string, Rect[]> {
  if (state.profile === "duo") return state.regions ?? {};

  return Object.fromEntries(
    Object.entries(index).flatMap(([name, c]) => (c.states[state.id] ? [[name, c.states[state.id]]] : [])),
  );
}
