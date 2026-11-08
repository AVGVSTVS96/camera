import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import pixelmatch from "pixelmatch";
import { webkit, type Browser } from "playwright";
import { PNG } from "pngjs";
import { fontconfig, mainOut, out, specs } from "./paths.ts";
import { publish } from "./publish.ts";
import { read, scene } from "./scene.ts";
import { serve } from "./serve.ts";
import { states, type State } from "./states.ts";
import type { Rect } from "./tree.ts";

const uiThreshold = 16;
const browsers = Number(process.env.BROWSERS ?? 3);
const processes = Number(process.env.PROCESSES ?? 1);

export interface Score {
  score: number;
  compared: number;
  mismatched: number;
}

export interface Result extends Score {
  id: string;
  profile: string;
  mode: string;
  display: string;
  orientation: string;
  components: Record<string, Score & { regions: Rect[] }>;
  apple: string;
  ours: string;
  diff: string;
  time: number;
}

const percent = (compared: number, mismatched: number) =>
  compared ? Math.round((1 - mismatched / compared) * 10000) / 100 : 100;

function differs(a: Buffer, b: Buffer, i: number) {
  return Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > uiThreshold;
}

function mask(rects: Rect[], scale: number, width: number, height: number) {
  const inside = new Uint8Array(width * height);

  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x * scale));
    const x1 = Math.min(width, Math.ceil((r.x + r.w) * scale));

    for (let y = Math.max(0, Math.floor(r.y * scale)); y < Math.min(height, Math.ceil((r.y + r.h) * scale)); y++) {
      inside.fill(1, y * width + x0, y * width + x1);
    }
  }

  return inside;
}

function shrink(image: PNG, by: number) {
  const small = new PNG({ width: Math.floor(image.width / by), height: Math.floor(image.height / by) });

  for (let y = 0; y < small.height; y++) {
    for (let x = 0; x < small.width; x++) {
      for (let c = 0; c < 4; c++) {
        let sum = 0;

        for (let dy = 0; dy < by; dy++) {
          for (let dx = 0; dx < by; dx++) sum += image.data[((y * by + dy) * image.width + x * by + dx) * 4 + c];
        }

        small.data[(y * small.width + x) * 4 + c] = sum / (by * by);
      }
    }
  }

  return small;
}

async function compare(state: State, oursPath: string, regions: Record<string, Rect[]>): Promise<Result> {
  const apple = await read(state.image);
  const ours = await read(oursPath);
  const { plate: platePath, ignore } = await scene(state);
  const plate = await read(platePath);
  const { width, height } = apple;
  const scale = state.screen.scale;

  if (ours.width !== width || ours.height !== height) {
    throw new Error(`${state.id}: ours is ${ours.width}×${ours.height}, Apple's is ${width}×${height}`);
  }

  const oursSmall = shrink(ours, scale);
  const counted = new Uint8Array(width * height);
  const skipped = mask(ignore, scale, width, height);

  for (let p = 0; p < counted.length; p++) {
    const i = p * 4;

    if (!skipped[p] && (differs(apple.data, plate.data, i) || differs(ours.data, plate.data, i))) counted[p] = 1;
    else apple.data.copy(ours.data, i, i, i + 4);
  }

  const diff = new PNG({ width, height });
  pixelmatch(apple.data, ours.data, diff.data, width, height, { threshold: 0.1, alpha: 0.25 });
  const wrong = (p: number) => diff.data[p * 4] === 255 && diff.data[p * 4 + 1] === 0 && diff.data[p * 4 + 2] === 0;
  const diffPath = join(out, "diff", `${state.id}.png`);
  await Bun.write(diffPath, PNG.sync.write(diff));
  const small = { apple: shrink(apple, scale), ours: oursSmall, diff: shrink(diff, scale) };
  await Promise.all(
    Object.entries(small).map(([kind, image]) =>
      Bun.write(join(out, "small", `${state.id}-${kind}.png`), PNG.sync.write(image)),
    ),
  );

  const tally = (inside?: Uint8Array) => {
    let compared = 0;
    let mismatched = 0;

    for (let p = 0; p < counted.length; p++) {
      if (!counted[p] || (inside && !inside[p])) continue;
      compared++;

      if (wrong(p)) mismatched++;
    }

    return { score: percent(compared, mismatched), compared, mismatched };
  };

  return {
    id: state.id,
    profile: state.profile,
    mode: state.mode,
    display: state.display,
    orientation: state.orientation,
    ...tally(),
    components: Object.fromEntries(
      Object.entries(regions).map(([name, rects]) => [
        name,
        { ...tally(mask(rects, scale, width, height)), regions: rects },
      ]),
    ),
    apple: state.image,
    ours: oursPath,
    diff: diffPath,
    time: Date.now(),
  };
}

async function render(browser: Browser, url: URL, state: State) {
  const page = await browser.newPage({
    viewport: { width: state.screen.widthPt, height: state.screen.heightPt },
    deviceScaleFactor: state.screen.scale,
  });

  await page.goto(new URL(`/?state=${state.id}`, url).href);
  await page.waitForSelector("html[data-ready]");
  const path = join(out, "ours", `${state.id}.png`);
  await page.screenshot({ path });
  await page.close();

  return path;
}

const { values: flags, positionals: ids } = parseArgs({
  allowPositionals: true,
  options: {
    component: { type: "string" },
    "no-build": { type: "boolean" },
    sample: { type: "string" },
    worst: { type: "string", default: "15" },
  },
});

const all = await states();

const index: Record<string, { about: string; states: Record<string, Rect[]> }> = await Bun.file(
  join(specs, "index.json"),
).json();

function regionsOf(state: State): Record<string, Rect[]> {
  if (state.profile === "duo") return state.regions ?? {};

  return Object.fromEntries(
    Object.entries(index).flatMap(([name, c]) => (c.states[state.id] ? [[name, c.states[state.id]]] : [])),
  );
}

const component = flags.component;

if (component && !index[component]) {
  throw new Error(`No component ${component}. Components: ${Object.keys(index).join(", ")}`);
}

function pick(id: string) {
  const state = all.find((s) => s.id === id);

  if (!state) throw new Error(`No state ${id}`);

  return state;
}

async function lastScore(state: State) {
  for (const dir of [out, mainOut]) {
    const file = Bun.file(join(dir, "results", `${state.id}.json`));

    if (await file.exists()) {
      const result: Result = await file.json();

      return component ? result.components[component]?.score : result.score;
    }
  }
}

async function sample(candidates: State[], size: number) {
  const scored = await Promise.all(candidates.map(async (state) => ({ state, score: (await lastScore(state)) ?? -1 })));

  const groups = Map.groupBy(
    scored.toSorted((a, b) => a.score - b.score || a.state.id.localeCompare(b.state.id)),
    ({ state }) => `${state.profile} ${state.display} ${state.orientation}`,
  );

  const rounds = [...groups.values()].flatMap((group) => group.map(({ state }, round) => ({ state, round })));

  return rounds
    .toSorted((a, b) => a.round - b.round)
    .slice(0, size)
    .map(({ state }) => state);
}

const candidates = component ? all.filter((s) => regionsOf(s)[component]) : ids.length ? ids.map(pick) : all;
const chosen = flags.sample ? await sample(candidates, Number(flags.sample)) : candidates;

if (!flags["no-build"]) {
  const build = Bun.spawnSync(["bun", "run", "build"], { cwd: join(import.meta.dir, "../web"), stdout: "ignore" });

  if (!build.success) throw new Error(build.stderr.toString());
}

for (const dir of ["ours", "diff", "small", "results"]) mkdirSync(join(out, dir), { recursive: true });

async function shard(i: number) {
  const slice = chosen.filter((_, j) => j % processes === i).map((s) => s.id);

  const child = Bun.spawn(["bun", import.meta.path, "--no-build", ...slice], {
    env: { ...process.env, PROCESSES: "1" },
    stdout: component ? "ignore" : "inherit",
    stderr: "inherit",
  });

  if ((await child.exited) !== 0) throw new Error(`Shard ${i} exited with ${child.exitCode}`);
}

async function run() {
  const server = await serve();
  const queue = [...chosen];

  async function work() {
    const browser = await webkit.launch({
      env: existsSync(fontconfig) ? { ...process.env, FONTCONFIG_FILE: fontconfig } : undefined,
    });

    for (let state = queue.shift(); state; state = queue.shift()) {
      const result = await compare(state, await render(browser, server.url, state), regionsOf(state));
      await Bun.write(join(out, "results", `${state.id}.json`), JSON.stringify(result, null, 1));

      if (!component) console.log(`${state.id}: ${result.score}% of ${result.compared} pixels  ${result.diff}`);
    }

    await browser.close();
  }

  await Promise.all(Array.from({ length: browsers }, work));
  await server.stop();
}

if (processes > 1 && chosen.length > processes)
  await Promise.all(Array.from({ length: processes }, (_, i) => shard(i)));
else await run();

const results: Result[] = await Promise.all(
  chosen.map((s): Promise<Result> => Bun.file(join(out, "results", `${s.id}.json`)).json()),
);

const box = ({ x, y, w, h }: Rect) => `${Math.round(x)},${Math.round(y)} ${Math.round(w)}×${Math.round(h)}`;

const mean = (scores: number[]) => Math.round((scores.reduce((a, b) => a + b, 0) / (scores.length || 1)) * 100) / 100;

if (component) {
  const name = component;
  const rows = results.map((r) => ({ r, c: r.components[name] })).toSorted((a, b) => a.c.score - b.c.score);

  console.log(`\n${name}: ${mean(rows.map(({ c }) => c.score))}% over ${rows.length} states. ${index[name].about}`);
  console.log(
    `Specs: ${join(specs, "components", `${name}.json`)}\nWorst states (region score, region in points, diff):`,
  );

  for (const { r, c } of rows.slice(0, Number(flags.worst))) {
    console.log(`  ${c.score.toFixed(2).padStart(6)}%  ${r.id} [${r.profile}]  ${c.regions.map(box).join(" + ")}`);
    console.log(`           apple ${r.apple}\n           ours  ${r.ours}\n           diff  ${r.diff}`);
  }
}

if (!component && !ids.length && !flags.sample) {
  const current = new Set(all.map((s) => s.id));

  const board = (
    await Promise.all(
      readdirSync(join(out, "results")).map((f): Promise<Result> => Bun.file(join(out, "results", f)).json()),
    )
  )
    .filter((r) => current.has(r.id))
    .toSorted((a, b) => a.score - b.score);

  const components = Object.entries(index).map(([name, { about }]) => {
    const scored = board.flatMap((r) => (r.components?.[name] ? [r.components[name].score] : []));
    const duo = board.flatMap((r) => (r.profile === "duo" && r.components?.[name] ? [r.components[name].score] : []));

    return { name, about, score: mean(scored), states: scored.length, duo: duo.length ? mean(duo) : null };
  });

  const summary = {
    score: mean(board.map((r) => r.score)),
    simulator: mean(board.flatMap((r) => (r.profile === "simulator" ? [r.score] : []))),
    duo: mean(board.flatMap((r) => (r.profile === "duo" ? [r.score] : []))),
    components: components.toSorted((a, b) => a.score - b.score),
    states: board,
  };

  await Bun.write(join(out, "results.json"), JSON.stringify(summary, null, 1));
  console.log(`\nOverall ${summary.score}% (simulator ${summary.simulator}%, duo ${summary.duo}%)`);

  for (const c of summary.components) console.log(`  ${c.score.toFixed(2).padStart(6)}%  ${c.name} (${c.states})`);

  if (out === mainOut)
    await publish(summary).catch((e: Error) => console.error(`Scoreboard not published: ${e.message}`));
}
