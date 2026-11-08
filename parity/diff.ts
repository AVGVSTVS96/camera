import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { webkit } from "playwright";
import { PNG } from "pngjs";
import { key, out } from "./paths.ts";
import { publish } from "./publish.ts";
import { platePath, serve, states, type State } from "./serve.ts";

const uiThreshold = 16;

export interface Result {
  id: string;
  mode: string;
  display: string;
  orientation: string;
  score: number;
  mismatch: number;
  compared: number;
  mismatched: number;
  apple: string;
  ours: string;
  diff: string;
  time: number;
}

const read = async (path: string) => PNG.sync.read(Buffer.from(await Bun.file(path).arrayBuffer()));

function differs(a: Buffer, b: Buffer, i: number) {
  return Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])) > uiThreshold;
}

async function compare(state: State, oursPath: string): Promise<Result> {
  const apple = await read(join(key, state.image));
  const ours = await read(oursPath);
  const plate = await read(await platePath(state));
  const { width, height } = apple;

  if (ours.width !== width || ours.height !== height) {
    throw new Error(`${state.id}: ours is ${ours.width}×${ours.height}, Apple's is ${width}×${height}`);
  }

  let compared = 0;

  for (let i = 0; i < apple.data.length; i += 4) {
    if (differs(apple.data, plate.data, i) || differs(ours.data, plate.data, i)) compared++;
    else apple.data.copy(ours.data, i, i, i + 4);
  }

  const diff = new PNG({ width, height });
  const mismatched = pixelmatch(apple.data, ours.data, diff.data, width, height, { threshold: 0.1, alpha: 0.25 });
  const diffPath = join(out, "diff", `${state.id}.png`);
  await Bun.write(diffPath, PNG.sync.write(diff));

  const mismatch = compared ? mismatched / compared : 0;

  return {
    id: state.id,
    mode: state.mode,
    display: state.display,
    orientation: state.orientation,
    score: Math.round((1 - mismatch) * 10000) / 100,
    mismatch: Math.round(mismatch * 10000) / 100,
    compared,
    mismatched,
    apple: join(key, state.image),
    ours: oursPath,
    diff: diffPath,
    time: Date.now(),
  };
}

const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const all = await states();
const picked = ids.length ? ids.map((id) => pick(all, id)) : all;

function pick(list: State[], id: string) {
  const state = list.find((s) => s.id === id);

  if (!state) throw new Error(`No state ${id} in ${key}/states.json`);

  return state;
}

if (!process.argv.includes("--no-build")) {
  const build = Bun.spawnSync(["bun", "run", "build"], { cwd: join(import.meta.dir, "../web"), stdout: "ignore" });

  if (!build.success) throw new Error(build.stderr.toString());
}

for (const dir of ["ours", "diff", "results"]) mkdirSync(join(out, dir), { recursive: true });

const server = serve();
const browser = await webkit.launch();

for (const state of picked) {
  const page = await browser.newPage({
    viewport: { width: state.screen.widthPt, height: state.screen.heightPt },
    deviceScaleFactor: state.screen.scale,
  });

  await page.goto(new URL(`/?state=${state.id}`, server.url).href);
  await page.waitForSelector("html[data-ready]");
  const oursPath = join(out, "ours", `${state.id}.png`);
  await page.screenshot({ path: oursPath });
  await page.close();
  const result = await compare(state, oursPath);
  await Bun.write(join(out, "results", `${state.id}.json`), JSON.stringify(result, null, 2));
  console.log(
    `${state.id}: ${result.score}% (${result.mismatch}% of ${result.compared} compared pixels differ) ${result.diff}`,
  );
}

await browser.close();

server.stop();

const results = await Promise.all(
  readdirSync(join(out, "results")).map((f): Promise<Result> => Bun.file(join(out, "results", f)).json()),
);

const current = new Set(all.map((s) => s.id));
const board = results.filter((r) => current.has(r.id)).toSorted((a, b) => a.score - b.score);

await Bun.write(join(out, "results.json"), JSON.stringify(board, null, 2));

await publish(board).catch((e: Error) => console.error(`Scoreboard not published: ${e.message}`));
