import { duo, type Profile } from "./profile.ts";

export const modes = ["time-lapse", "slo-mo", "cinematic", "video", "photo", "portrait", "pano"] as const;

export type Mode = (typeof modes)[number];

export const movieModes = new Set<Mode>(["time-lapse", "slo-mo", "cinematic", "video"]);

const appleModes = new Map<string, Mode>([["slow-motion-video", "slo-mo"]]);

export const modeOf = (name: string) => appleModes.get(name) ?? modes.find((m) => m === name) ?? "photo";

export const lightings = ["natural", "studio", "contour", "stage", "stage-mono", "high-key-mono"] as const;

export type Lighting = (typeof lightings)[number];

const appleLightings = new Map<string, Lighting>([
  ["NATURAL LIGHT", "natural"],
  ["STUDIO LIGHT", "studio"],
  ["CONTOUR LIGHT", "contour"],
  ["STAGE LIGHT", "stage"],
  ["STAGE LIGHT MONO", "stage-mono"],
  ["HIGH-KEY LIGHT MONO", "high-key-mono"],
]);

export type Display = "outer" | "inner";

export type Orientation = "portrait" | "landscape";

export type Facing = "back" | "front";

export type Flash = "auto" | "on" | "off";

export type Controls = Record<string, boolean | string | number | string[] | null>;

export interface ParityState {
  id: string;
  mode: string;
  controls?: Controls | null;
  display: Display;
  orientation: Orientation;
  fold?: string;
  screen: { widthPt: number; heightPt: number; scale: number };
  profile?: Profile;
}

export interface Settings {
  mode: Mode;
  flash: Flash;
  live: boolean;
  night: boolean;
  macro: boolean;
  zoom: number;
  facing: Facing;
  grid: boolean;
  level: boolean;
  tray: boolean;
  submenu: boolean;
  square: boolean;
  lighting: Lighting;
  viewer: boolean;
  recording: boolean;
  orientation: Orientation;
  display: Display;
  fold?: string;
}

export type Update = (change: Partial<Settings>) => void;

export interface Props {
  settings: Settings;
  update: Update;
}

export function initialSettings(profile: Profile, mode: Mode = "photo", facing: Facing = "back"): Settings {
  return {
    mode,
    flash: movieModes.has(mode) ? "off" : "auto",
    live: false,
    night: true,
    macro: true,
    zoom: profile.zoom[`${facing}-${mode}`]?.start ?? 1,
    facing,
    grid: profile.grid,
    level: profile.level,
    tray: false,
    submenu: false,
    square: false,
    lighting: mode === "photo" ? "contour" : "natural",
    viewer: false,
    recording: false,
    orientation: "portrait",
    display: "outer",
  };
}

export function settingsFor(state: ParityState, profile = state.profile ?? duo): Settings {
  const c = state.controls ?? {};
  const mode = modeOf(state.mode);
  const facing = c.camera === "front" ? "front" : "back";
  const initial = initialSettings(profile, mode, facing);
  const flash = (["on", "off", "auto"] as const).find((f) => c.flash === f);

  return {
    ...initial,
    flash: flash ?? initial.flash,
    live: c.live === true || c.live === "on",
    grid: c.grid === true || initial.grid,
    level: c.level === true || initial.level,
    tray: c.panel === "open" || c.panel === "expanded",
    submenu: c.panel === "submenu",
    square: c.control === "Aspect Ratio" && c.selected === "Square",
    lighting: appleLightings.get(String(c.portraitLighting)) ?? initial.lighting,
    viewer: state.mode === "viewer",
    recording: c.action === "recording",
    orientation: state.orientation,
    display: state.display,
    fold: state.fold,
  };
}

export async function loadState(id: string) {
  const states: ParityState[] = await fetch("/states.json").then((r) => r.json());
  const state = states.find((s) => s.id === id);

  if (!state) throw new Error(`No state ${id} in states.json`);

  return state;
}
