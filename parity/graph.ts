import type { Controls } from "../web/src/state.ts";
import type { State } from "./states.ts";
import { tree } from "./tree.ts";

export type Step =
  | { tap: string; optional?: boolean }
  | { firstOf: string[] }
  | { mode: string }
  | { zoom: string }
  | { pinch: number }
  | { swipe: "zoom" }
  | { adjust: string | null; by: number }
  | { press: string; hold: number; slide?: number; release: boolean }
  | { point: [number, number] }
  | { wait: number };

export interface Launch {
  camera: "allowed" | "denied";
  firstRun: boolean;
}

export interface Route {
  launch: Launch;
  steps: Step[];
}

export interface Outside {
  outside: string;
}

interface Edge {
  parent?: string;
  steps: Step[];
  launch?: Partial<Launch>;
}

const dialLabels = new Map([["slow-motion-video", "SLO-MO"]]);

const dialLabel = (mode: string) => dialLabels.get(mode) ?? mode.toUpperCase();

const dismissals = ["Continue", "Not Now", "OK", "Done", "Close"];

const lightings = [
  "NATURAL LIGHT",
  "STUDIO LIGHT",
  "CONTOUR LIGHT",
  "STAGE LIGHT",
  "STAGE LIGHT MONO",
  "HIGH-KEY LIGHT MONO",
];

const seconds = (t: Controls[string]) => Number.parseFloat(String(t).replace("~", "")) * 1000;

const slug = (text: string) => text.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

function tagOf(state: State) {
  const right = state.display === "outer" && String(state.controls?.deviceHubOrientation).startsWith("landscape");

  return `${state.display}-${state.orientation}${right ? "-right" : ""}`;
}

export class Graph {
  readonly byId: Map<string, State>;

  constructor(states: State[]) {
    this.byId = new Map(states.map((s) => [s.id, s]));
  }

  private has(id: string) {
    return this.byId.has(id);
  }

  /** The answer key's parent of a state and the steps that lead from it, as the oracle's capture scripts took them. */
  edge(state: State): Edge | Outside {
    const c = state.controls ?? {};
    const duo = state.profile === "duo" ? "duo-" : "";
    const tag = tagOf(state);
    const front = c.camera === "front";
    const base = `${duo}${state.mode}-${tag}`;
    const prefix = `${base}${front ? "-front" : ""}`;
    const photo = `${duo}photo-${tag}`;

    const panel = (id: string) =>
      this.has(`${id}-controls-expanded`) ? `${id}-controls-expanded` : `${id}-controls-open`;

    const control = String(c.control ?? "");

    if (c.permission === "camera denied") return { steps: [], launch: { camera: "denied" } };

    if (c.sheet === "photographic-styles-onboarding") return { steps: [], launch: { firstRun: true } };

    if (c.sheet === "photographic-styles-choose") {
      return { parent: `first-run-photographic-styles-${tag}`, steps: [{ tap: "Choose Style" }] };
    }

    if (c.fold) return { outside: "needs the hinge half open, which no web API reports" };

    if (c.grid || c.level) return { outside: "Grid and Level are switched on in the Settings app, outside Camera" };

    if (state.mode === "viewer") {
      if (c.chrome) {
        return {
          parent: `viewer-${tag}-open`,
          steps: [{ point: [state.screen.widthPt / 2, state.screen.heightPt / 2] }],
        };
      }

      return { parent: `${photo}-default`, steps: [{ tap: "Photo and Video Viewer" }] };
    }

    if (c.smartTake === "turning on") return { parent: panel(prefix), steps: [{ tap: "Smart Take" }] };

    if (c.smartTake === "on") {
      return {
        parent: `${prefix}-smart-take-description`,
        steps: [{ firstOf: dismissals }, { tap: "Dismiss Camera Controls", optional: true }],
      };
    }

    if (c.action) return this.action(state, c, prefix);

    if (c.timer && c.panel === "closed") {
      return {
        parent: `${prefix}-timer-${slug(String(c.timer))}`,
        steps: [{ tap: "Back" }, { tap: "Dismiss Camera Controls", optional: true }],
      };
    }

    if (c.portraitLighting) {
      const by = lightings.indexOf(String(c.portraitLighting));

      return {
        parent: `${prefix}-default`,
        steps: by
          ? [{ adjust: "Lighting", by }]
          : [
              { adjust: "Lighting", by: 1 },
              { adjust: "Lighting", by: -1 },
            ],
      };
    }

    if (c.sheet === "first-run-intro") return { parent: `${photo}-default`, steps: [{ mode: dialLabel(state.mode) }] };

    if (c.panel === "open" && c.control) return { parent: panel(prefix), steps: [{ tap: control }] };

    if (c.panel === "open") return { parent: `${prefix}-default`, steps: [{ tap: "Camera Controls" }] };

    if (c.panel === "expanded") return { parent: `${prefix}-controls-open`, steps: [{ tap: "Expand" }] };

    if (c.panel === "styles customize") {
      return c.tab === "Texture"
        ? { parent: `${prefix}-styles-customize-palette`, steps: [{ tap: "Texture" }] }
        : { parent: `${prefix}-styles-submenu`, steps: [{ tap: "Customize" }] };
    }

    if (c.panel === "submenu") return this.submenu(state, c, `${prefix}-${slug(control)}`, panel(prefix));

    if (c.zoomDial) return { parent: `${prefix}-default`, steps: [{ swipe: "zoom" }] };

    if (c.via) {
      const factor = Number.parseFloat(String(c.zoom)) || Number.parseFloat(String(c.via).replace(/^\D+/, ""));

      return { parent: `${prefix}-default`, steps: [{ pinch: factor }] };
    }

    if (c.zoomButton) return { parent: `${prefix}-default`, steps: [{ zoom: String(c.zoomButton) }] };

    if (front) return { parent: `${base}-default`, steps: [{ tap: "Camera Chooser" }] };

    if (state.mode !== "photo") {
      return {
        parent: `${photo}-default`,
        steps: [{ mode: dialLabel(state.mode) }, { firstOf: dismissals }],
      };
    }

    return { steps: [] };
  }

  private submenu(state: State, c: Controls, id: string, panel: string): Edge {
    if (c.adjust) {
      const parent = this.byId.get(`${id}-submenu`);
      const options = [parent?.controls?.options ?? []].flat();
      const suffix = state.id.slice(id.length + 1, -`-${c.adjust}`.length);
      const label = options.find((o) => o !== null && slug(String(o)) === suffix) ?? null;
      const name = label === null ? null : String(label);

      return c.adjust === "inc"
        ? { parent: `${id}-submenu`, steps: [{ adjust: name, by: 2 }] }
        : { parent: `${id}-${suffix}-inc`, steps: [{ adjust: name, by: -4 }] };
    }

    if (c.selected && !Array.isArray(c.selected)) {
      return { parent: `${id}-submenu`, steps: [{ tap: String(c.selected) }] };
    }

    return { parent: panel, steps: [{ tap: String(c.control) }] };
  }

  private action(state: State, c: Controls, prefix: string): Edge | Outside {
    const action = String(c.action);
    const t = seconds(c.t);
    const shutter = { tap: "shutter" };

    if (action === "shutter tapped") return { parent: `${prefix}-default`, steps: [shutter, { wait: t }] };

    if (action === "recording") {
      return state.id.endsWith("-later")
        ? { parent: `${prefix}-recording`, steps: [{ wait: 2000 }] }
        : { parent: `${prefix}-default`, steps: [shutter, { wait: t }] };
    }

    if (action === "stopped") return { parent: `${prefix}-recording-later`, steps: [shutter, { wait: 2500 }] };

    if (action === "shutter held (QuickTake)") {
      return { parent: `${prefix}-default`, steps: [{ press: "shutter", hold: t, release: false }] };
    }

    if (action === "QuickTake released") {
      return { parent: `${prefix}-default`, steps: [{ press: "shutter", hold: 3500, release: true }, { wait: 1000 }] };
    }

    if (action === "QuickTake slid to lock") {
      return {
        parent: `${prefix}-quicktake-released`,
        steps: [{ press: "shutter", hold: 800, slide: 160, release: true }, { wait: 1200 }],
      };
    }

    if (action === "countdown running") {
      return state.id.endsWith("-2")
        ? { parent: `${prefix}-timer-countdown`, steps: [{ wait: 1000 }] }
        : { parent: `${prefix}-timer-10s-armed`, steps: [shutter, { wait: 1200 }] };
    }

    if (action === "countdown cancelled by shutter tap") {
      return { parent: `${prefix}-timer-countdown-2`, steps: [shutter, { wait: 1500 }] };
    }

    if (action === "tap viewfinder centre") {
      return state.id.endsWith("-later")
        ? { parent: `${prefix}-tap-to-focus`, steps: [{ wait: 3000 }] }
        : { parent: `${prefix}-default`, steps: [{ tap: "Viewfinder" }, { wait: t }] };
    }

    if (action === "long-press viewfinder (AE/AF lock)") {
      return { parent: `${prefix}-default`, steps: [{ press: "Viewfinder", hold: 1500, release: true }] };
    }

    if (action === "drag up beside focus box") {
      return { parent: `${prefix}-ae-af-lock`, steps: [{ press: "Viewfinder", hold: 300, slide: -80, release: true }] };
    }

    return { outside: `no route for action "${action}"` };
  }

  /** Steps from launch, or why the state can't be reached from inside the app. */
  route(state: State): Route | Outside {
    const steps: Step[] = [];
    const launch: Launch = { camera: "allowed", firstRun: false };

    for (let at: State | undefined = state; at;) {
      const edge = this.edge(at);

      if ("outside" in edge) return edge;

      steps.unshift(...edge.steps);
      Object.assign(launch, edge.launch);

      if (!edge.parent) return { launch, steps };

      const parent = this.byId.get(edge.parent);

      if (!parent) return { outside: `its parent ${edge.parent} isn't in the answer key` };

      at = parent;
    }

    return { launch, steps };
  }

  /** Taps whose label the parent state's accessibility tree doesn't have: gaps in the answer key's tap graph. */
  async unlabeled(state: State) {
    const edge = this.edge(state);

    if ("outside" in edge || !edge.parent) return [];

    const parent = this.byId.get(edge.parent);

    if (!parent?.ax) return [];

    const { ax } = await tree(parent);
    const labels = new Set(ax.flatMap((e) => [e.label, e.value]).map((l) => String(l).toLowerCase()));

    return edge.steps.flatMap((step) =>
      "tap" in step && step.tap !== "shutter" && !step.optional && !labels.has(step.tap.toLowerCase())
        ? [`${state.id}: "${step.tap}" isn't in ${parent.id}'s accessibility tree`]
        : [],
    );
  }
}

export function describe(step: Step) {
  if ("tap" in step) return `tap ${step.tap}${step.optional ? " (if shown)" : ""}`;

  if ("firstOf" in step) return "dismiss any sheet";

  if ("mode" in step) return `switch to ${step.mode}`;

  if ("zoom" in step) return `tap zoom ${step.zoom}`;

  if ("pinch" in step) return `pinch to ${step.pinch}×`;

  if ("swipe" in step) return "swipe across the zoom stops";

  if ("adjust" in step)
    return `${step.by > 0 ? "raise" : "lower"} ${step.adjust ?? "slider"} ${Math.abs(step.by)} ticks`;

  if ("press" in step) {
    return `hold ${step.press} ${step.hold} ms${step.slide ? `, slide ${step.slide}pt` : ""}${step.release ? "" : " (still held)"}`;
  }

  if ("point" in step) return `tap at ${step.point.join(",")}`;

  return `wait ${step.wait} ms`;
}
