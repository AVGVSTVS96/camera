import { join } from "node:path";
import type { Controls } from "../web/src/state.ts";
import { duo, key } from "./paths.ts";
import type { Rect } from "./tree.ts";

export type ProfileName = "simulator" | "duo";

export interface State {
  id: string;
  profile: ProfileName;
  image: string;
  views?: string;
  ax?: string;
  mode: string;
  controls?: Controls | null;
  display: "outer" | "inner";
  orientation: "portrait" | "landscape";
  fold?: string;
  screen: { widthPt: number; heightPt: number; scale: number };
  hostArtifact?: boolean;
  regions?: Record<string, Rect[]>;
  ignore?: Rect[];
}

async function load(dir: string, profile: ProfileName): Promise<State[]> {
  const list: State[] = await Bun.file(join(dir, "states.json")).json();

  return list.map((s) => ({
    ...s,
    profile,
    image: join(dir, s.image),
    views: s.views && join(dir, s.views),
    ax: s.ax && join(dir, s.ax),
  }));
}

export async function states() {
  const all = [...(await load(key, "simulator")), ...(await load(duo, "duo"))];

  return all.filter((s) => !s.hostArtifact);
}
