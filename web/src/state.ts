export const modes = ["time-lapse", "slo-mo", "cinematic", "video", "photo", "portrait", "pano"] as const;

export type Mode = (typeof modes)[number];

export const movieModes = new Set<Mode>(["time-lapse", "slo-mo", "cinematic", "video"]);

export type Display = "outer" | "inner";

export type Orientation = "portrait" | "landscape";

export type Flash = "auto" | "on" | "off";

export interface ParityState {
  id: string;
  mode: string;
  controls?: string | string[] | Record<string, boolean | string | number>;
  display: Display;
  orientation: Orientation;
  fold?: string;
  screen: { widthPt: number; heightPt: number; scale: number };
}

export interface Settings {
  mode: Mode;
  flash: Flash;
  live: boolean;
  night: boolean;
  macro: boolean;
  zoom: number;
  facing: "environment" | "user";
  tray: boolean;
  viewer: boolean;
  recording: boolean;
  orientation: Orientation;
  display: Display;
  fold?: string;
}

export const initialSettings: Settings = {
  mode: "photo",
  flash: "auto",
  live: false,
  night: true,
  macro: true,
  zoom: 1,
  facing: "environment",
  tray: false,
  viewer: false,
  recording: false,
  orientation: "portrait",
  display: "outer",
};

function flags(controls: ParityState["controls"]) {
  if (controls === undefined) return new Set<string>();

  if (Array.isArray(controls)) return new Set(controls);

  if (controls instanceof Object) {
    return new Set(
      Object.entries(controls).flatMap(([key, value]) => (value === true ? [key] : value ? [`${key}-${value}`] : [])),
    );
  }

  return new Set([controls]);
}

export function settingsFor(state: ParityState): Settings {
  const on = flags(state.controls);
  const mode = modes.find((m) => m === state.mode.toLowerCase()) ?? "photo";
  const flash = (["on", "off", "auto"] as const).find((f) => on.has(`flash-${f}`));

  return {
    ...initialSettings,
    mode,
    flash: flash ?? (movieModes.has(mode) ? "off" : "auto"),
    live: on.has("live") || on.has("live-on"),
    tray: on.has("tray") || on.has("more"),
    viewer: on.has("viewer"),
    recording: on.has("recording"),
    facing: on.has("front") ? "user" : "environment",
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
