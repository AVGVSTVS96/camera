import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Profile, Zoom } from "../web/src/profile.ts";
import { modeOf, modes } from "../web/src/state.ts";
import { components, find, type Found } from "./components.ts";
import { specs } from "./paths.ts";
import { states, type State } from "./states.ts";
import { tree, walk, type Rect, type Tree, type View } from "./tree.ts";

const round = (n: number) => Math.round(n * 100) / 100;

const rect = ({ x, y, w, h }: Partial<Rect>) => ({
  x: round(x ?? 0),
  y: round(y ?? 0),
  w: round(w ?? 0),
  h: round(h ?? 0),
});

const looks = [
  "bg",
  "alpha",
  "cornerRadius",
  "font",
  "text",
  "textColor",
  "image",
  "tint",
  "transform",
  "id",
  "ax",
  "selected",
] as const;

function describe(view: View) {
  const props = Object.fromEntries(
    looks.flatMap((k) => {
      const value = view[k];

      if (value === undefined || value === false) return [];

      return [[k, k === "image" ? String(value).replaceAll(/0x[0-9a-f]+/g, "") : value]];
    }),
  );

  return { class: view.class, frame: rect(view.frame), ...props };
}

function nodes(found: Found) {
  return found.views.flatMap((root) => [...walk([root])].map(([v]) => describe(v)));
}

const context = (s: State) => `${s.display}-${s.orientation}`;

interface Variant {
  states: string[];
  contexts: string[];
  nodes: ReturnType<typeof describe>[];
  ax: { identifier?: string; label?: string; value?: string; frame: Rect }[];
}

const all = await states();
const simulator = all.filter((s) => s.profile === "simulator").toSorted((a, b) => a.id.localeCompare(b.id));
const trees = new Map<string, Tree>();

for (const state of simulator) trees.set(state.id, await tree(state));

const index: Record<string, { about: string; states: Record<string, Rect[]> }> = {};
const byId = new Map(simulator.map((s) => [s.id, s]));

rmSync(join(specs, "components"), { recursive: true, force: true });

mkdirSync(join(specs, "components"), { recursive: true });

mkdirSync(join(specs, "profiles"), { recursive: true });

for (const component of components) {
  const variants = new Map<string, Variant>();
  const placed: Record<string, Rect[]> = {};
  const offscreen: string[] = [];

  for (const state of simulator) {
    const found = find(component, state, trees.get(state.id)!);

    if (!found) continue;

    if (!found.regions.length) {
      offscreen.push(state.id);
      continue;
    }

    placed[state.id] = found.regions.map(rect);

    const variant = {
      nodes: nodes(found),
      ax: found.ax.map(({ identifier, label, value, frame }) => ({ identifier, label, value, frame: rect(frame) })),
    };

    const signature = JSON.stringify(variant);
    const seen = variants.get(signature) ?? { states: [], contexts: [], ...variant };
    seen.states.push(state.id);

    if (!seen.contexts.includes(context(state))) seen.contexts.push(context(state));

    variants.set(signature, seen);
  }

  const ids = Object.keys(placed);
  const duo = all.filter((s) => s.regions?.[component.name]).map((s) => s.id);

  const count = (pick: (s: State) => string) =>
    Object.fromEntries(
      [...new Set(ids.map((id) => pick(byId.get(id)!)))].map((k) => [
        k,
        ids.filter((id) => pick(byId.get(id)!) === k).length,
      ]),
    );

  index[component.name] = { about: component.about, states: placed };
  await Bun.write(
    join(specs, "components", `${component.name}.json`),
    JSON.stringify(
      {
        name: component.name,
        about: component.about,
        profiles: { simulator: ids.length, duo: duo.length },
        contexts: count(context),
        modes: count((s) => s.mode),
        duo,
        offscreen,
        variants: [...variants.values()].toSorted((a, b) => b.states.length - a.states.length),
      },
      null,
      1,
    ),
  );
  console.log(`${component.name}: ${ids.length} states, ${variants.size} variants, ${offscreen.length} off-screen`);
}

await Bun.write(join(specs, "index.json"), JSON.stringify(index, null, 1));

function zoomOf(id: string): Zoom | undefined {
  const labels = [...walk(trees.get(id)?.views ?? [])]
    .flatMap(([view, parent]) => (view.class === "UILabel" && parent?.class === "CAMZoomFactorLabel" ? [view] : []))
    .toSorted((a, b) => a.frame.x - b.frame.x)
    .map((view) => view.text ?? "");

  if (!labels.length) return;

  return {
    stops: labels.map((label) => Number(label.replace("×", ""))),
    start: Number(labels.find((label) => label.endsWith("×"))?.replace("×", "") ?? 1),
  };
}

const defaults = simulator.filter((s) => /^[a-z-]+-outer-portrait-(front-)?default$/.test(s.id));
const shows = (name: string, list = defaults) => list.some((s) => index[name].states[s.id]);

const axValue = (id: string, identifier: string) =>
  trees.get(id)?.ax.find((e) => e.identifier === identifier)?.value ?? "";

const format = (value: string) => {
  const [kind, detail = ""] = value.split(", ");

  return `${kind} ${Number.parseInt(detail)}`;
};

const profile: Profile = {
  name: "simulator",
  modes: modes.filter((m) => simulator.some((s) => modeOf(s.mode) === m && s.mode !== "viewer")),
  zoom: Object.fromEntries(
    defaults.flatMap((s) => {
      const zoom = zoomOf(s.id);
      const facing = s.controls?.camera === "front" ? "front" : "back";

      return zoom ? [[`${facing}-${modeOf(s.mode)}`, zoom]] : [];
    }),
  ),
  badges: shows("top-bar"),
  smartTake: shows("smart-take"),
  macro: shows("macro"),
  grid: shows("grid"),
  level: shows("grid"),
  photoFormat: format(axValue("photo-outer-portrait-controls-open", "FormatAndResolutionButton")),
  videoFormat: format(axValue("video-outer-portrait-controls-open", "VideoFormatAndResolutionButton")),
  library: !simulator.some(
    (s) =>
      s.mode === "viewer" && [...walk(trees.get(s.id)!.views)].some(([v]) => v.class === "UIContentUnavailableView"),
  ),
};

await Bun.write(join(specs, "profiles", "simulator.json"), JSON.stringify(profile, null, 1));

console.log(`simulator profile: ${JSON.stringify(profile)}`);
