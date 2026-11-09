import { duo, type Profile } from "./profile.ts";
import type { StyleName } from "./components/submenu-styles/styles.ts";

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

export type LivePhoto = "auto" | "on" | "off";

export interface Settings {
  mode: Mode;
  flash: Flash;
  live: boolean;
  night: boolean;
  macro: boolean;
  zoom: number;
  dial: boolean;
  lenses: boolean;
  facing: Facing;
  grid: boolean;
  level: boolean;
  tray: boolean;
  expanded: boolean;
  on: string[];
  submenu: boolean;
  format: { resolution: "HD" | "4K"; rate: number } | null;
  balance: string | null;
  livePhoto: LivePhoto | null;
  flashMenu: Flash | null;
  exposure: number | null;
  focus?: { value: number; auto: boolean };
  styles: boolean;
  style: StyleName;
  customize: boolean;
  countdown: boolean;
  holding: boolean;
  square: boolean;
  aspect: string | null;
  lighting: Lighting;
  picked: boolean;
  viewer: boolean;
  recording: boolean;
  sheet?: Sheet;
  timer: number | null;
  timerMenu: boolean;
  depth: boolean;
  aperture: Aperture | null;
  orientation: Orientation;
  display: Display;
  fold?: string;
}

export type Sheet = "intro" | "styles" | "choose";

const sheets = new Map<string, Sheet>([
  ["first-run-intro", "intro"],
  ["photographic-styles-onboarding", "styles"],
  ["photographic-styles-choose", "choose"],
]);

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
    dial: false,
    lenses: false,
    facing,
    grid: profile.grid,
    level: profile.level,
    tray: false,
    expanded: false,
    on: [],
    submenu: false,
    format: null,
    balance: null,
    livePhoto: null,
    flashMenu: null,
    exposure: null,
    styles: false,
    style: "standard",
    customize: false,
    countdown: false,
    holding: false,
    square: false,
    aspect: null,
    lighting: "natural",
    picked: false,
    viewer: false,
    recording: false,
    timer: null,
    timerMenu: false,
    depth: false,
    aperture: null,
    orientation: "portrait",
    display: "outer",
  };
}

// Apple's simulator keeps 4K once chosen, so every Video Format state after the first shows it.
function formatOf(mode: Mode, c: Controls): Settings["format"] {
  if (c.panel !== "submenu" || c.control !== "Video Format") return null;

  const picked = Array.isArray(c.selected) ? c.selected : [c.selected];
  const rate =
    Number.parseInt(String(picked.find((s) => String(s).includes("frames")))) || (mode === "slo-mo" ? 120 : 30);

  return { resolution: Array.isArray(c.selected) ? "HD" : "4K", rate };
}

const exposureOf = (c: Controls) => ({ dec: -0.7, inc: 0.7 })[String(c.adjust)] ?? 0;

const livePhotoOf = (c: Controls): LivePhoto | null =>
  c.panel === "submenu" && c.control === "Live Photo"
    ? Array.isArray(c.selected)
      ? "auto"
      : c.selected === "On"
        ? "on"
        : "off"
    : null;

const flashChoice = (c: Controls): Flash => ({ on: "on", off: "off" })[String(c.selected).toLowerCase()] ?? "auto";

const lightingControls = ["Aspect Ratio", "Exposure", "Flash", "Live Photo", "Timer"];

// Apple's simulator remembers the Portrait lighting chosen in earlier captures, so the dial's effect follows the capture history rather than any control.
function rememberedLighting(state: ParityState): Lighting {
  const c = state.controls ?? {};
  const front = c.camera === "front";
  const control = String(c.control);
  const innerPortrait = state.display === "inner" && state.orientation === "portrait";

  if (state.mode === "photo") {
    const natural =
      (control === "Depth" && !front) ||
      (front && innerPortrait && lightingControls.includes(control)) ||
      (front && c.zoom === null) ||
      (!front &&
        Array.isArray(c.selected) &&
        (state.orientation === "landscape" ? control === "Timer" : innerPortrait && control === "Exposure"));

    return natural ? "natural" : "contour";
  }

  const outerPortrait = state.display === "outer" && state.orientation === "portrait";

  return front && outerPortrait && control !== "Depth" && control !== "White Balance" ? "contour" : "natural";
}

const focusOf = (c: Controls) =>
  c.panel === "submenu" && c.control === "Focus"
    ? { value: Number.parseFloat(String(c.value)) || 0, auto: c.value === "Auto" }
    : undefined;

const timerOf = (c: Controls) => Number.parseInt(String(c.control === "Timer" ? c.selected : c.timer)) || null;

const aspectNames = new Map([
  ["4 by 3", "4:3"],
  ["16 by 9", "16:9"],
  ["Square", "1:1"],
]);

const aspectOf = (c: Controls) =>
  c.panel === "submenu" && c.control === "Aspect Ratio" ? (aspectNames.get([c.selected].flat().join()) ?? "4:3") : null;

const hasOptions = (c: Controls) => Array.isArray(c.selected);

// Apple's simulator keeps Depth on or off from earlier captures, so its value follows the capture history rather than any control.
function depthOn(state: ParityState, c: Controls) {
  const back = c.camera === "back";

  if (state.mode !== "photo") return false;

  if (state.orientation === "landscape") {
    if (c.control === "Flash" || c.control === "Timer") return true;

    if (c.control === "White Balance") return back;

    if (c.control === "Night Mode") return hasOptions(c);

    return c.control === "Depth" && !hasOptions(c);
  }

  if (state.display !== "inner" || !c.camera) return false;

  if (!c.control) return !back || "zoom" in c || "zoomDial" in c;

  if (c.control === "Focus" || c.control === "Resolution") return false;

  if (c.control === "White Balance") return !back;

  if (c.control === "Night Mode") return hasOptions(c) && !back;

  return c.control !== "Depth" || !hasOptions(c);
}

// Marks count in third-stops from ƒ1.4 (0); each lens and mode shows its own range of them.
export interface Aperture {
  first: number;
  at: number;
  last: number;
  off?: boolean;
  reset?: boolean;
  unavailable?: boolean;
}

// Apple's simulator keeps the f-stop it last had, so these follow its capture history; a reset button shows once the value moved.
function apertureOf(state: ParityState, c: Controls): Aperture {
  const front = c.camera === "front";
  const moved = (Array.isArray(c.options) && c.options.includes("Reset")) || (!front && c.adjust !== undefined);

  if (state.mode === "photo") {
    if (c.selected !== "Depth") return { first: 1, at: 13, last: 13, off: true };

    const wide = front && state.display === "inner" && state.orientation === "landscape";

    return { first: 0, at: wide ? 10 : 6, last: wide ? 22 : 18, unavailable: true };
  }

  if (state.mode === "portrait") return { first: 0, at: moved ? 11 : 10, last: 21, reset: moved };

  if (front) return moved ? { first: 3, at: 7, last: 19, reset: true } : { first: 3, at: 10, last: 21 };

  return moved ? { first: 3, at: 7, last: 19, reset: true } : { first: 3, at: 6, last: 18 };
}

export function settingsFor(state: ParityState, profile = state.profile ?? duo): Settings {
  const c = state.controls ?? {};
  const mode = modeOf(state.mode);
  const facing = c.camera === "front" ? "front" : "back";
  const initial = initialSettings(profile, mode, facing);
  const lowest = mode === "portrait" ? 0.5 : Math.min(...(profile.zoom[`${facing}-${mode}`]?.stops ?? [initial.zoom]));
  const flash = (["on", "off", "auto"] as const).find((f) => c.flash === f);

  return {
    ...initial,
    zoom: Number.parseFloat(String(c.zoom)) || (c.zoomDial === "open" ? lowest : initial.zoom),
    dial: c.zoomDial === "open",
    lenses: mode === "portrait" && ("zoomButton" in c || c.zoomDial === "open"),
    flash: flash ?? initial.flash,
    live: c.live === true || c.live === "on",
    grid: c.grid === true || initial.grid,
    level: c.level === true || initial.level,
    tray: c.panel === "open" || c.panel === "expanded",
    expanded: c.panel === "expanded" || c.control !== undefined,
    on: c.control && (c.to === "On" || c.to === "Adaptive") ? [String(c.control)] : [],
    submenu: c.panel === "submenu",
    format: formatOf(mode, c),
    flashMenu: c.panel === "submenu" && c.control === "Flash" ? flashChoice(c) : null,
    balance: c.panel === "submenu" && c.control === "White Balance" ? String(c.selected).toLowerCase() : null,
    livePhoto: livePhotoOf(c),
    exposure: c.panel === "submenu" && c.control === "Exposure" ? exposureOf(c) : null,
    focus: focusOf(c),
    styles: c.control === "Styles",
    style: c.adjust === "dec" ? "gold" : c.adjust === "inc" ? "natural" : "standard",
    customize: c.selected === "Customize",
    countdown: c.action === "countdown running",
    holding: c.action === "shutter held (QuickTake)",
    square: c.control === "Aspect Ratio" && c.selected === "Square",
    aspect: aspectOf(c),
    lighting: appleLightings.get(String(c.portraitLighting)) ?? rememberedLighting(state),
    picked: c.portraitLighting !== undefined,
    viewer: state.mode === "viewer",
    recording: c.action === "recording",
    sheet: sheets.get(String(c.sheet)),
    timer: timerOf(c),
    timerMenu: c.control === "Timer",
    depth: depthOn(state, c),
    aperture: c.panel === "submenu" && c.control === "Depth" ? apertureOf(state, c) : null,
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
