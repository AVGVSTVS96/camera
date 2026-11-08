import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";
import type { Result } from "./diff.ts";
import { out } from "./paths.ts";

const target = process.env.PAGES ?? "bassim@server:Developer/pages/pages";

export async function publish(results: Result[]) {
  const dir = join(out, "camera-parity");
  mkdirSync(dir, { recursive: true });

  for (const r of results) {
    for (const kind of ["apple", "ours", "diff"] as const) copyFileSync(r[kind], join(dir, `${r.id}-${kind}.png`));
  }

  const board = results.map(({ apple: _a, ours: _o, diff: _d, ...r }) => r);
  await Bun.write(join(dir, "results.json"), JSON.stringify(board));
  await $`rsync -a --delete ${dir}/ ${target}/camera-parity/`.quiet();
  await $`rsync -a ${join(import.meta.dir, "scoreboard.html")} ${target}/camera-parity.html`.quiet();
}

if (import.meta.main) await publish(await Bun.file(join(out, "results.json")).json());
