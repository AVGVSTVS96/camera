import type { Settings, Sheet } from "./state.ts";

export const storageKey = "camera";

interface Memory {
  seen: Sheet[];
  live?: Settings["live"];
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

/** Settings > Camera > Preserve Settings as it ships: only Live Photo is on, so everything else resets on launch. */
export const preserve = ({ live }: Settings) => write({ live });

export function restore(settings: Settings): Settings {
  const { live } = read();

  return live ? { ...settings, live } : settings;
}
