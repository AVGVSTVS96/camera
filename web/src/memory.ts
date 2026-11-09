import type { Settings, Sheet } from "./state.ts";

export const storageKey = "camera";

type Kept = Pick<Settings, "live" | "night" | "on">;

interface Memory {
  seen: Sheet[];
  kept?: Kept;
}

function read(): Memory {
  try {
    return { seen: [], ...JSON.parse(localStorage.getItem(storageKey) ?? "{}") };
  } catch {
    return { seen: [] };
  }
}

const write = (change: Partial<Memory>) => localStorage.setItem(storageKey, JSON.stringify({ ...read(), ...change }));

/** The first-run sheet to show now, if Camera hasn't shown it before. */
export const unseen = (sheet: "intro" | "styles") => (read().seen.includes(sheet) ? undefined : sheet);

export function remember(sheet: Sheet) {
  const { seen } = read();

  if (!seen.includes(sheet)) write({ seen: [...seen, sheet] });
}

/** Settings > Camera > Preserve Settings with Apple's defaults: Night Mode, Live Photo and Action Mode stay; mode, styles, lighting and exposure reset. */
export function preserve({ live, night, on }: Settings) {
  write({ kept: { live, night, on: on.filter((t) => t !== "Time-Lapse Mode") } });
}

export function restore(settings: Settings): Settings {
  const { kept } = read();

  if (!kept) return settings;

  return { ...settings, live: kept.live, night: settings.facing === "front" ? "off" : kept.night, on: kept.on };
}
