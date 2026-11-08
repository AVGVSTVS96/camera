import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { out } from "./paths.ts";
import { plate } from "./plate.ts";
import type { State } from "./states.ts";
import { clip, pad, tree, walk, type Rect } from "./tree.ts";

export const read = async (path: string) => PNG.sync.read(Buffer.from(await Bun.file(path).arrayBuffer()));

const housing = new Map<string, Rect>([
  ["outer-portrait", { x: 396, y: 22, w: 44, h: 70 }],
  ["outer-landscape", { x: 608, y: 396, w: 44, h: 44 }],
]);

function fill(image: PNG, rect: Rect, scale: number, color: string) {
  const rgba = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16)).concat(255);

  for (let y = Math.round(rect.y * scale); y < Math.round((rect.y + rect.h) * scale); y++) {
    for (let x = Math.round(rect.x * scale); x < Math.round((rect.x + rect.w) * scale); x++) {
      image.data.set(rgba, (y * image.width + x) * 4);
    }
  }
}

const edges = ({ x, y, w, h }: Rect, by: number): Rect[] =>
  [
    { x, y, w, h: 0 },
    { x, y: y + h, w, h: 0 },
    { x, y, w: 0, h },
    { x: x + w, y, w: 0, h },
  ].map((r) => pad(r, by));

async function feed(state: State) {
  const preview = [...walk((await tree(state)).views)].find(([v]) => v.class === "CAMPreviewView")?.[0];
  const rect = preview && clip(preview.frame, state);

  if (!preview || !rect) return { ignore: [] };

  const placeholder = [...walk(preview.subviews ?? [])].flatMap(([v]) => (v.text ? [pad(v.frame, 2)] : []));

  return { rect, color: preview.bg ?? "#8F8F94", ignore: [...placeholder, ...edges(rect, 4)] };
}

async function write(file: string, image: PNG) {
  mkdirSync(join(out, "plates"), { recursive: true });
  await Bun.write(file, PNG.sync.write(image));
}

export interface Scene {
  plate: string;
  ignore: Rect[];
}

export async function scene(state: State): Promise<Scene> {
  const file = join(out, "plates", `${state.id}.png`);
  const fresh = existsSync(file) && statSync(file).mtimeMs > statSync(state.views ?? state.image).mtimeMs;
  const system = housing.get(`${state.display}-${state.orientation}`);
  const ignore = [...(state.ignore ?? []), ...(system ? [system] : [])];

  if (state.profile === "duo") {
    if (!fresh) await write(file, plate(await read(state.image)));

    return { plate: file, ignore };
  }

  const { rect, color, ignore: placeholder } = await feed(state);

  if (!fresh) {
    const { widthPt, heightPt, scale } = state.screen;
    const image = new PNG({ width: Math.round(widthPt * scale), height: Math.round(heightPt * scale) });
    fill(image, { x: 0, y: 0, w: widthPt, h: heightPt }, scale, "#000000");

    if (rect && color) fill(image, rect, scale, color);

    await write(file, image);
  }

  return { plate: file, ignore: [...placeholder, ...ignore].flatMap((r) => clip(r, state) ?? []) };
}
