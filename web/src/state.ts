import { duo, type Profile } from "./profile.ts";
import { nameOf, type StyleName } from "./components/submenu-styles/styles.ts";

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

export type Fold = "closed" | "open" | "half-open";

export interface Pose {
  display: Display;
  orientation: Orientation;
  fold: Fold;
}

// The outer display is 466pt across and the inner 669pt; Safari's bars take up to about 100pt of either.
export function poseOf(width: number, height: number): Pose {
  const display = Math.min(width, height) > 560 ? "inner" : "outer";

  return {
    display,
    orientation: width > height ? "landscape" : "portrait",
    fold: display === "inner" ? "open" : "closed",
  };
}

export type Facing = "back" | "front";

export type Flash = "auto" | "on" | "off";

export type LivePhoto = "auto" | "on" | "off";

export type NightMode = "auto" | "max" | "off";

export const whiteBalances = ["auto", "tungsten", "fluorescent", "daylight", "cloudy", "shadow"] as const;

export type WhiteBalance = (typeof whiteBalances)[number];

export type AspectRatio = "4:3" | "16:9" | "1:1";

export type VideoResolution = "HD" | "4K";

export interface VideoFormat {
  resolution: VideoResolution;
  rate: number;
}

// Slo-mo films 240 fps only in HD: choosing 4K there drops to 120, and anything else at 240 keeps HD.
export function changeFormat(format: VideoFormat, change: Partial<VideoFormat> = {}): VideoFormat {
  const next = { ...format, ...change };

  if (next.rate !== 240 || next.resolution === "HD") return next;

  return change.resolution ? { ...next, rate: 120 } : { ...next, resolution: "HD" };
}

export interface CenterStage {
  zoom: boolean;
  rotate: boolean;
}

export interface Aperture {
  first: number;
  at: number;
  home: number;
  last: number;
  off?: boolean;
  unavailable?: boolean;
}

export const submenus = [
  "Flash",
  "Live Photo",
  "Aspect Ratio",
  "Timer",
  "Exposure",
  "Styles",
  "Depth",
  "Night Mode",
  "Resolution",
  "Center Stage",
  "Focus",
  "White Balance",
  "Video Format",
  "Video Resolution",
] as const;

export type Submenu = (typeof submenus)[number];

export const toggles = ["Smart Take", "Action Mode", "Time-Lapse Mode"] as const;

export type Toggle = (typeof toggles)[number];

export const isToggle = (name: Controls[string]): name is Toggle => toggles.some((t) => t === name);

export type Sheet = "intro" | "styles" | "choose";

const sheets = new Map<string, Sheet>([
  ["first-run-intro", "intro"],
  ["photographic-styles-onboarding", "styles"],
  ["photographic-styles-choose", "choose"],
]);

export interface Settings extends Pose {
  mode: Mode;
  facing: Facing;
  zoom: number;
  flash: Flash;
  live: LivePhoto;
  night: NightMode;
  macro: boolean;
  aspect: AspectRatio;
  timer: number | null;
  exposure: number;
  balance: WhiteBalance;
  style: StyleName;
  pad: { tone: number; color: number };
  texture: boolean;
  grade: string;
  resolution: 24 | 48;
  formats: Partial<Record<Mode, VideoFormat>>;
  videoResolution: VideoResolution;
  focus: { value: number; auto: boolean };
  centerStage: CenterStage;
  aperture?: Aperture;
  stops: Partial<Record<Mode, number | undefined>>;
  depth: boolean;
  lighting: Lighting;
  on: Toggle[];
  grid: boolean;
  level: boolean;
  lock: boolean;

  tray: boolean;
  expanded: boolean;
  submenu: Submenu | null;
  customize: boolean;
  dial: boolean;
  lenses: boolean;
  zoomTurn: number;
  flipTurn: number;
  picked: boolean;
  countdown: number;
  holding: boolean;
  recording: boolean;
  paused: boolean;
  viewer: boolean;
  sheet?: Sheet;
}

export type Update = (change: Partial<Settings>) => void;

export interface Props {
  settings: Settings;
  update: Update;
}

export const back: Partial<Settings> = { submenu: null, tray: true, expanded: true };

export const toggle = (on: Toggle[], name: Toggle) =>
  on.includes(name) ? on.filter((t) => t !== name) : [...on, name];

export const defaultRate = (mode: Mode) => (mode === "slo-mo" ? 120 : 30);

export function defaultAperture({ mode, facing, depth }: Pick<Settings, "mode" | "facing" | "depth">): Aperture {
  if (mode === "photo") {
    return depth
      ? { first: 0, at: 6, home: 6, last: 18, unavailable: true }
      : { first: 1, at: 13, home: 13, last: 13, off: true };
  }

  if (mode === "portrait") return { first: 0, at: 10, home: 10, last: 21 };

  return facing === "front" ? { first: 3, at: 10, home: 10, last: 21 } : { first: 3, at: 6, home: 6, last: 18 };
}

const clampStop = ({ first, last }: Aperture, at: number) => Math.min(last, Math.max(first, at));

export function apertureOf(settings: Settings): Aperture {
  if (settings.aperture) return settings.aperture;

  const aperture = defaultAperture(settings);
  const at = settings.stops[settings.mode];

  return at === undefined ? aperture : { ...aperture, at: clampStop(aperture, at) };
}

const startZoom = (profile: Profile, facing: Facing, mode: Mode) => profile.zoom[`${facing}-${mode}`]?.start ?? 1;

const defaultFlash = (mode: Mode): Flash => (movieModes.has(mode) ? "off" : "auto");

export const switchMode = (
  profile: Profile,
  { mode: from, facing, flash }: Settings,
  mode: Mode,
): Partial<Settings> => ({
  mode,
  zoom: startZoom(profile, facing, mode),
  flash: movieModes.has(mode) === movieModes.has(from) ? flash : defaultFlash(mode),
  lock: false,
});

export const flipCamera = (profile: Profile, { mode, facing }: Settings): Partial<Settings> => {
  const to = facing === "front" ? "back" : "front";

  return { facing: to, zoom: startZoom(profile, to, mode), night: to === "front" ? "off" : "auto", lock: false };
};

export function initialSettings(profile: Profile, pose: Pose, mode: Mode = "photo", facing: Facing = "back"): Settings {
  const [, megapixels] = profile.photoFormat.split(" ");
  const resolution = profile.videoFormat.startsWith("4K") ? "4K" : "HD";

  return {
    ...pose,
    mode,
    facing,
    zoom: startZoom(profile, facing, mode),
    flash: defaultFlash(mode),
    live: "auto",
    night: facing === "front" ? "off" : "auto",
    macro: true,
    aspect: "4:3",
    timer: null,
    exposure: 0,
    balance: "auto",
    style: "standard",
    pad: { tone: 0, color: 0 },
    texture: false,
    grade: "standard",
    resolution: megapixels === "48" ? 48 : 24,
    formats: {
      video: { resolution, rate: 30 },
      cinematic: { resolution, rate: 30 },
      "slo-mo": { resolution: "HD", rate: 120 },
    },
    videoResolution: resolution,
    focus: { value: 0, auto: true },
    // Camera opens with Auto Zoom on only while the phone is held upright, as every pose in Apple's captures starts.
    centerStage: { zoom: (pose.display === "outer") === (pose.orientation === "portrait"), rotate: false },
    stops: {},
    depth: false,
    lighting: "natural",
    on: [],
    grid: profile.grid,
    level: profile.level,
    lock: false,

    tray: false,
    expanded: false,
    submenu: null,
    customize: false,
    dial: false,
    lenses: false,
    zoomTurn: 0,
    flipTurn: 0,
    picked: false,
    countdown: 0,
    holding: false,
    recording: false,
    paused: false,
    viewer: false,
  };
}

export type Controls = Record<string, boolean | string | number | string[] | null>;

export interface ParityState {
  id: string;
  mode: string;
  controls?: Controls | null;
  display: Display;
  orientation: Orientation;
  fold: Fold;
  screen: { widthPt: number; heightPt: number; scale: number };
  profile?: Profile;
}

const named = (selected: Controls[string]) => [selected].flat().join().toLowerCase();

function flashOf(selected: Controls[string]): Flash {
  const name = named(selected);

  return name === "on" || name === "off" ? name : "auto";
}

function liveOf(selected: Controls[string]): LivePhoto {
  if (Array.isArray(selected)) return "auto";

  return selected === "On" ? "on" : "off";
}

function nightOf(selected: Controls[string]): NightMode {
  const name = named(selected);

  return name === "max" || name === "off" ? name : "auto";
}

const balanceOf = (selected: Controls[string]) => whiteBalances.find((b) => b === named(selected)) ?? "auto";

const aspects = new Map<string, AspectRatio>([
  ["4 by 3", "4:3"],
  ["16 by 9", "16:9"],
  ["Square", "1:1"],
]);

const exposureOf = (adjust: Controls[string]) => ({ dec: -0.7, inc: 0.7 })[String(adjust)] ?? 0;

function stopsOf(settings: Settings, adjust: Controls[string]): Settings["stops"] {
  const ticks = { dec: -2, inc: 2 }[String(adjust)];
  const aperture = defaultAperture(settings);

  if (!ticks || aperture.off || aperture.unavailable) return {};

  return { [settings.mode]: clampStop(aperture, aperture.at + ticks) };
}

const styleOf = (c: Controls): StyleName => (c.adjust ? nameOf(c.value) : "standard");

const megapixelsOf = (selected: Controls[string]) => (named(selected).startsWith("48") ? 48 : 24);

function formatOf(mode: Mode, c: Controls, current: VideoFormat): VideoFormat {
  const choice = [c.selected].flat();
  const rate = Number.parseInt(String(choice.find((s) => String(s).includes("frames")))) || defaultRate(mode);

  return changeFormat(current, choice.includes("4K") ? { resolution: "4K", rate } : { rate });
}

function centerStageOf(c: Controls, current: CenterStage): CenterStage {
  if (c.value === undefined) return { ...current, rotate: c.selected === "On" };

  const value = String(c.value);

  return { zoom: value.includes("Auto Zoom, On"), rotate: value.includes("Auto Rotate, On") };
}

const focusOf = (value: Controls[string]) => ({ value: Number.parseFloat(String(value)) || 0, auto: value === "Auto" });

const timerOf = (c: Controls) => Number.parseInt(String(c.control === "Timer" ? c.selected : c.timer)) || null;

function submenuOf(c: Controls): Submenu | null {
  if (c.panel === "styles customize") return "Styles";

  if (c.panel !== "submenu") return null;

  return submenus.find((s) => s === c.control) ?? null;
}

function choose(settings: Settings, c: Controls): Partial<Settings> {
  const { mode, formats } = settings;
  const format = formats[mode];

  switch (submenuOf(c)) {
    case "Flash":
      return { flash: flashOf(c.selected) };
    case "Live Photo":
      return { live: liveOf(c.selected) };
    case "Night Mode":
      return Array.isArray(c.selected) ? {} : { night: nightOf(c.selected) };
    case "Aspect Ratio":
      return { aspect: aspects.get([c.selected].flat().join()) ?? "4:3" };
    case "Exposure":
      return { exposure: exposureOf(c.adjust) };
    case "White Balance":
      return { balance: balanceOf(c.selected) };
    case "Styles":
      return { style: styleOf(c) };
    case "Resolution":
      return { resolution: megapixelsOf(c.selected) };
    case "Video Format":
      return format ? { formats: { ...formats, [mode]: formatOf(mode, c, format) } } : {};
    case "Video Resolution":
      return { videoResolution: c.selected === "4K" ? "4K" : "HD" };
    case "Depth":
      return c.selected === "Depth" ? { depth: true } : { stops: stopsOf(settings, c.adjust) };
    case "Focus":
      return { focus: focusOf(c.value) };
    case "Center Stage":
      return { centerStage: centerStageOf(c, settings.centerStage) };
    default:
      return {};
  }
}

const lockActions = new Set(["long-press viewfinder (AE/AF lock)", "drag up beside focus box"]);

export function reached(state: ParityState, profile = state.profile ?? duo): Settings {
  const c = state.controls ?? {};
  const mode = modeOf(state.mode);
  const facing = c.camera === "front" ? "front" : "back";
  const { display, orientation, fold } = state;
  const initial = initialSettings(profile, { display, orientation, fold }, mode, facing);
  const lowest = mode === "portrait" ? 0.5 : Math.min(...(profile.zoom[`${facing}-${mode}`]?.stops ?? [initial.zoom]));
  const toggled = c.control;

  return {
    ...initial,
    ...choose(initial, c),
    zoom:
      Number.parseFloat(String(c.zoom)) ||
      Number.parseFloat(String(c.via).replace(/^\D+/, "")) ||
      (c.zoomDial === "open" && c.zoom ? lowest : initial.zoom),
    timer: timerOf(c),
    lighting: appleLightings.get(String(c.portraitLighting)) ?? initial.lighting,
    on: c.smartTake ? ["Smart Take"] : isToggle(toggled) && (c.to === "On" || c.to === "Adaptive") ? [toggled] : [],
    grid: c.grid === true || initial.grid,
    level: c.level === true || initial.level,
    lock: lockActions.has(String(c.action)),

    tray: c.panel === "open" || c.panel === "expanded",
    expanded: c.panel === "expanded" || (c.panel === "open" && c.control !== undefined),
    submenu: submenuOf(c),
    customize: c.selected === "Customize" || c.panel === "styles customize",
    texture: c.tab === "Texture",
    dial: c.zoomDial === "open",
    lenses: mode === "portrait" && ("zoomButton" in c || c.zoomDial === "open"),
    picked: c.portraitLighting !== undefined,
    countdown: c.action === "countdown running" ? (timerOf(c) ?? 0) - (state.id.endsWith("-2") ? 3 : 1) : 0,
    holding: c.action === "shutter held (QuickTake)",
    recording: c.action === "recording",
    paused: false,
    viewer: state.mode === "viewer",
    sheet: sheets.get(String(c.sheet)),
  };
}

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

const touches = /^(shutter tapped|long-press|drag|tap viewfinder)/;

// Apple's simulator leaves the zoom stops turned the way the device last was, so the turn follows the capture history rather than any control.
function zoomTurnOf(state: ParityState, c: Controls, dialOpen = false) {
  const portrait = state.orientation === "portrait";

  const touched = touches.test(String(c.action));

  if (state.mode === "photo" && portrait && touched) return 180;

  const sideways = state.display === "inner" && (state.mode === "photo" || (state.mode === "cinematic" && !portrait));

  const resting =
    c.timer === undefined &&
    c.smartTake === undefined &&
    (c.panel !== undefined ||
      (portrait && c.fold !== undefined) ||
      (c.zoom !== undefined && (dialOpen || c.zoomDial === undefined)));

  return sideways && (resting || touched) ? 90 : 0;
}

// Apple's simulator leaves Time-lapse on the ultra wide lens after some captures, so this follows its capture history rather than any control.
function wideTimeLapse(state: ParityState, c: Controls) {
  const portrait = state.orientation === "portrait";
  const control = String(c.control);

  return (
    state.mode === "time-lapse" &&
    c.panel === "submenu" &&
    (c.selected === "4K" ||
      (portrait && (state.display === "inner" ? control === "Exposure" : ["Focus", "White Balance"].includes(control))))
  );
}

const hasOptions = (c: Controls) => Array.isArray(c.selected);

// Apple's simulator keeps Depth on or off from earlier captures, so its value follows the capture history rather than any control.
function depthOn(state: ParityState, c: Controls) {
  const rear = c.camera === "back";

  if (state.mode !== "photo") return false;

  if (state.orientation === "landscape") {
    if (c.control === "Flash" || c.control === "Timer") return true;

    if (c.control === "White Balance") return rear;

    if (c.control === "Night Mode") return hasOptions(c);

    return c.control === "Depth" && !hasOptions(c);
  }

  if (state.display !== "inner" || !c.camera) return false;

  if (!c.control) return !rear || "zoom" in c || "zoomDial" in c;

  if (c.control === "Focus" || c.control === "Resolution") return false;

  if (c.control === "White Balance") return !rear;

  if (c.control === "Night Mode") return hasOptions(c) && !rear;

  return c.control !== "Depth" || !hasOptions(c);
}

// Apple's simulator captured each pose's Night Mode states before its Smart Take toggle, except inner portrait, so Night Mode shows the Off they left.
const nightLeftOff = (state: ParityState, c: Controls) =>
  c.control === "Smart Take" && !(state.display === "inner" && state.orientation === "portrait");

// Apple's simulator keeps the f-stop it last had, so these follow its capture history.
function rememberedAperture(state: ParityState, c: Controls): Aperture {
  const front = c.camera === "front";
  const moved = (Array.isArray(c.options) && c.options.includes("Reset")) || (!front && c.adjust !== undefined);

  if (state.mode === "photo") {
    if (c.selected !== "Depth") return defaultAperture({ mode: "photo", facing: "back", depth: false });

    const at = front && state.display === "inner" && state.orientation === "landscape" ? 10 : 6;

    return { first: 0, at, home: at, last: at + 12, unavailable: true };
  }

  if (state.mode === "portrait") return { first: 0, at: moved ? 11 : 10, home: 10, last: 21 };

  if (front) return moved ? { first: 3, at: 7, home: 10, last: 19 } : { first: 3, at: 10, home: 10, last: 21 };

  return moved ? { first: 3, at: 7, home: 6, last: 19 } : { first: 3, at: 6, home: 6, last: 18 };
}

// Apple's simulator long-pressed the zoom stops right after the pose's zoom-stop capture, so the dial shows the zoom that tap left.
const heldZoom = (state: ParityState, c: Controls, zoom: number) =>
  c.zoomDial === "open" && !c.zoom ? (state.mode === "cinematic" ? 2 : 0.5) : zoom;

// Apple's simulator keeps 4K once chosen, so every Video Format choice after the first shows it.
function rememberedFormats({ mode, formats, submenu }: Settings, c: Controls) {
  const format = formats[mode];

  if (submenu !== "Video Format" || !format || Array.isArray(c.selected)) return formats;

  return { ...formats, [mode]: changeFormat({ ...format, resolution: "4K" }) };
}

// A forced state: what tapping reaches, plus what Apple's simulator carried over from earlier captures.
export function settingsFor(state: ParityState, profile = state.profile ?? duo): Settings {
  const c = state.controls ?? {};
  const settings = reached(state, profile);

  return {
    ...settings,
    zoom: wideTimeLapse(state, c) ? 0.5 : heldZoom(state, c, settings.zoom),
    zoomTurn: zoomTurnOf(state, c),
    flipTurn: zoomTurnOf(state, c, true),
    depth: depthOn(state, c),
    night:
      settings.submenu === "Night Mode" && hasOptions(c)
        ? nightOf(c.selected)
        : nightLeftOff(state, c)
          ? "off"
          : settings.night,
    lighting: settings.picked ? settings.lighting : rememberedLighting(state),
    aperture: settings.submenu === "Depth" ? rememberedAperture(state, c) : undefined,
    formats: rememberedFormats(settings, c),
  };
}

export async function loadState(id: string) {
  const states: ParityState[] = await fetch("/states.json").then((r) => r.json());
  const state = states.find((s) => s.id === id);

  if (!state) throw new Error(`No state ${id} in states.json`);

  return state;
}
