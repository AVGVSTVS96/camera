import { join } from "node:path";
import { $ } from "bun";
import type { Result } from "./diff.ts";
import { out } from "./paths.ts";

const target = process.env.PAGES ?? "bassim@server:Developer/pages/pages";

export interface Summary {
  states: Result[];
}

export async function publish(summary: Summary) {
  const states = summary.states.map(({ apple: _a, ours: _o, diff: _d, ...r }) => r);
  await Bun.write(join(out, "small", "results.json"), JSON.stringify({ ...summary, states }));
  await $`rsync -a --delete ${join(out, "small")}/ ${target}/camera-parity/`.quiet();
  await $`rsync -a ${join(import.meta.dir, "scoreboard.html")} ${target}/camera-parity.html`.quiet();
}

if (import.meta.main) await publish(await Bun.file(join(out, "results.json")).json());
