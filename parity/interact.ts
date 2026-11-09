import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { $ } from "bun";
import { chromium, type Browser } from "playwright";
import { duo, type Profile } from "../web/src/profile.ts";
import { reached, type Settings } from "../web/src/state.ts";
import { camera, film, open, phone, perform, settings, settle, snapshot, type Driver } from "./drive.ts";
import { describe, Graph, type Step } from "./graph.ts";
import { apple, fromState, judge, measure, transitions } from "./motion.ts";
import { fontconfig, mainOut, out, pages, specs } from "./paths.ts";
import { compare, index, regionsOf } from "./score.ts";
import { serve } from "./serve.ts";
import { states, type State } from "./states.ts";

export type Reach = "reachable" | "unreachable" | "wrong";

export interface Reached {
  id: string;
  reach: Reach;
  why?: string;
  steps: string[];
  failedAt?: number;
  score?: { live: number; forced: number };
  components: Record<string, { reach: Reach; live?: number; forced?: number }>;
  time: number;
}

// Half-open states are never driven, and the live app can't see the hinge.
const ignored = new Set<keyof Settings>(["fold"]);
const slack = 3;
const workers = Number(process.env.BROWSERS ?? 4);
const dir = join(out, "interact");

const { values: flags, positionals: ids } = parseArgs({
  allowPositionals: true,
  options: {
    component: { type: "string" },
    sample: { type: "string" },
    "no-build": { type: "boolean" },
    "no-motion": { type: "boolean" },
  },
});

const all = await states();
const graph = new Graph(all);
const simulator: Profile = await Bun.file(join(specs, "profiles/simulator.json")).json();
const component = flags.component;

if (component && !index[component]) {
  throw new Error(`No component ${component}. Components: ${Object.keys(index).join(", ")}`);
}

function pick(id: string) {
  const state = graph.byId.get(id);

  if (!state) throw new Error(`No state ${id}`);

  return state;
}

async function previous(state: State): Promise<Reached | undefined> {
  const file = Bun.file(join(dir, "results", `${state.id}.json`));

  return (await file.exists()) ? file.json() : undefined;
}

/** Spreads the sample over profile and pose, failing states first. */
async function sample(candidates: State[], size: number) {
  const ranked = await Promise.all(
    candidates.map(async (state) => ({ state, done: (await previous(state))?.reach === "reachable" })),
  );

  const groups = Map.groupBy(
    ranked.toSorted((a, b) => Number(a.done) - Number(b.done) || a.state.id.localeCompare(b.state.id)),
    ({ state }) => `${state.profile} ${state.display} ${state.orientation}`,
  );

  return [...groups.values()]
    .flatMap((group) => group.map(({ state }, round) => ({ state, round })))
    .toSorted((a, b) => a.round - b.round)
    .slice(0, size)
    .map(({ state }) => state);
}

const candidates = component ? all.filter((s) => regionsOf(s)[component]) : ids.length ? ids.map(pick) : all;
const chosen = flags.sample ? await sample(candidates, Number(flags.sample)) : candidates;

const moves = (step: Step) => !("wait" in step) && !("firstOf" in step) && !("tap" in step && step.optional);

function expected(state: State) {
  return reached({ ...state, controls: state.controls ?? null }, state.profile === "simulator" ? simulator : duo);
}

function differences(want: Settings, got: Settings) {
  const keys = new Set([...Object.keys(want), ...Object.keys(got)]);

  return [...keys].flatMap((k) => {
    // SAFETY: k is one of the keys of the two Settings objects.
    const field = k as keyof Settings;
    const [a, b] = [JSON.stringify(want[field]), JSON.stringify(got[field])];

    return ignored.has(field) || a === b ? [] : [`${k} ${b ?? "unset"}, wants ${a ?? "unset"}`];
  });
}

async function forced(browser: Browser, url: URL, state: State) {
  const context = await phone(browser, state);
  const page = await context.newPage();
  await page.goto(new URL(`/?state=${state.id}&reached`, url).href);
  await page.waitForSelector("html[data-ready]");
  await page.addStyleTag({ content: ".inner-edge, .inner-preview, .inner-home { visibility: hidden }" });
  const path = join(dir, "forced", `${state.id}.png`);
  await page.screenshot({ path });
  await context.close();

  return path;
}

async function check(browser: Browser, url: URL, state: State): Promise<Reached> {
  const route = graph.route(state);
  const regions = regionsOf(state);

  const verdict = (reach: Reach, rest: Partial<Reached> = {}): Reached => ({
    id: state.id,
    reach,
    steps: "outside" in route ? [] : route.steps.map(describe),
    components: Object.fromEntries(Object.keys(regions).map((name) => [name, { reach }])),
    time: Date.now(),
    ...rest,
  });

  if ("outside" in route) return verdict("unreachable", { why: route.outside });

  let driver: Driver | undefined;

  try {
    driver = await open(browser, url, state, route.launch);
    const { page } = driver;

    let idle: number | undefined;

    for (const [i, step] of route.steps.entries()) {
      const before = await snapshot(page);
      const failed = await perform(driver, step);

      if (failed) return verdict("unreachable", { why: `${describe(step)}: ${failed}`, failedAt: i });

      await settle(page);

      if (idle === undefined && moves(step) && (await snapshot(page)) === before) idle = i;
    }

    const live = await settings(page);

    if (!live) return verdict("unreachable", { why: "the app never reported its settings" });

    const wrong = differences(expected(state), live);

    if (wrong.length && idle !== undefined) {
      return verdict("unreachable", { why: `${describe(route.steps[idle])} did nothing`, failedAt: idle });
    }

    if (wrong.length) return verdict("wrong", { why: wrong.join("; ") });

    const shot = join(dir, "live", `${state.id}.png`);

    await page.addStyleTag({ content: ".thumb img, .inner-edge, .inner-preview, .inner-home { visibility: hidden }" });
    await page.screenshot({ path: shot });

    const [ours, theirs] = await Promise.all([
      compare(state, shot, regions, join(dir, "live")),
      compare(state, await forced(browser, url, state), regions, join(dir, "forced")),
    ]);

    const components = Object.fromEntries(
      Object.keys(regions).map((name) => {
        const [l, f] = [ours.components[name].score, theirs.components[name].score];

        return [name, { reach: l >= f - slack ? ("reachable" as const) : ("wrong" as const), live: l, forced: f }];
      }),
    );

    const reach = ours.score >= theirs.score - slack ? "reachable" : "wrong";
    const why = reach === "wrong" ? `live render scores ${ours.score}%, forced ${theirs.score}%` : undefined;

    return verdict(reach, { why, components, score: { live: ours.score, forced: theirs.score } });
  } catch (error) {
    return verdict("unreachable", { why: `harness error: ${String(error).split("\n")[0]}` });
  } finally {
    await driver?.context.close();
  }
}

async function time(browser: Browser, url: URL, name?: string) {
  const chosenTransitions = transitions.filter((t) => !name || t.component === name);

  return Promise.all(
    chosenTransitions.map(async (t) => {
      const state = pick(fromState(t));
      const route = graph.route(state);
      const theirs = apple[t.id];

      if ("outside" in route) return { id: t.id, component: t.component, verdict: "missing" as const };

      const driver = await open(browser, url, state, route.launch);

      try {
        for (const step of route.steps) {
          await perform(driver, step);
          await settle(driver.page);
        }

        const { trigger } = t;

        const shots = await film(
          driver,
          async () => {
            await ("unfold" in trigger
              ? driver.page.setViewportSize({
                  width: pick(trigger.unfold).screen.widthPt,
                  height: pick(trigger.unfold).screen.heightPt,
                })
              : perform(driver, trigger));
          },
          Math.max(1.2, theirs.latency + theirs.duration + 0.5),
        );

        const ours = measure(shots, theirs.roiPt);

        return { id: t.id, component: t.component, apple: theirs, ours, ...judge(ours, theirs) };
      } finally {
        await driver.context.close();
      }
    }),
  );
}

if (!flags["no-build"]) {
  const build = Bun.spawnSync(["bun", "run", "build"], { cwd: join(import.meta.dir, "../web"), stdout: "ignore" });

  if (!build.success) throw new Error(build.stderr.toString());
}

for (const sub of ["results", "live", "forced"]) mkdirSync(join(dir, sub), { recursive: true });

const server = await serve();

const browser = await chromium.launch({
  args: await camera(dir),
  env: existsSync(fontconfig) ? { ...process.env, FONTCONFIG_FILE: fontconfig } : undefined,
});

const queue = [...chosen];
const results: Reached[] = [];

async function work() {
  for (let state = queue.shift(); state; state = queue.shift()) {
    const result = await check(browser, server.url, state);
    results.push(result);
    await Bun.write(join(dir, "results", `${state.id}.json`), JSON.stringify(result, null, 1));

    if (!component && ids.length) console.log(`${state.id}: ${result.reach}${result.why ? ` (${result.why})` : ""}`);
  }
}

await Promise.all(Array.from({ length: workers }, work));

const timings = flags["no-motion"] || ids.length ? [] : await time(browser, server.url, component);

await Promise.all([browser.close(), server.stop()]);

const tally = (rows: Reach[]) => ({
  reachable: rows.filter((r) => r === "reachable").length,
  unreachable: rows.filter((r) => r === "unreachable").length,
  wrong: rows.filter((r) => r === "wrong").length,
});

const components = Object.entries(index).flatMap(([name, { about }]) => {
  const rows = results.flatMap((r) => (r.components[name] ? [r.components[name].reach] : []));

  return rows.length ? [{ name, about, states: rows.length, ...tally(rows) }] : [];
});

const line = (c: { reachable: number; unreachable: number; wrong: number }) =>
  `${String(c.reachable).padStart(4)} reachable ${String(c.unreachable).padStart(4)} unreachable ${String(c.wrong).padStart(4)} wrong`;

const reasons = (rows: Reached[]) =>
  [...Map.groupBy(rows, (r) => (r.why ?? "").replaceAll(/"[^"]*"/g, '"…"').replaceAll(/\d+(\.\d+)?/g, "#"))]
    .map(([why, group]) => ({ why, count: group.length, example: group[0] }))
    .toSorted((a, b) => b.count - a.count);

const focus = component ? results.filter((r) => r.components[component]) : results;
const overall = tally(results.map((r) => r.reach));

console.log(`\n${results.length} states: ${line(overall)}`);

for (const row of components.filter((c) => !component || c.name === component)) {
  console.log(`  ${row.name.padEnd(26)} ${line(row)}`);
}

for (const reach of ["wrong", "unreachable"] as const) {
  const rows = focus.filter((r) => (component ? r.components[component].reach : r.reach) === reach);

  if (!rows.length) continue;

  console.log(`\n${reach === "wrong" ? "Reached wrong" : "Unreachable"}, by reason:`);

  for (const { why, count, example } of reasons(rows).slice(0, 12)) {
    console.log(`  ${String(count).padStart(4)}× ${why}\n         e.g. ${example.id}: ${example.why}`);
    console.log(`         route: ${example.steps.join(" → ") || "launch"}`);
  }
}

for (const hit of focus.filter((r) => r.reach === "reachable")) {
  const score = component ? hit.components[component] : hit.score;
  console.log(`  reachable ${hit.id}  live ${score?.live ?? "–"}%  forced ${score?.forced ?? "–"}%`);
}

if (timings.length) console.log("\nMotion (ours vs Apple, seconds):");

for (const t of timings) {
  const ours = "ours" in t && t.ours ? `${t.ours.latency.toFixed(2)}+${t.ours.duration.toFixed(2)}` : "none";
  const theirs = `${apple[t.id].latency.toFixed(2)}+${apple[t.id].duration.toFixed(2)}`;
  const rmse = "rmse" in t && t.rmse !== undefined ? `  curve RMSE ${t.rmse.toFixed(2)}` : "";
  console.log(`  ${t.verdict.padEnd(8)} ${t.id.padEnd(30)} ours ${ours.padEnd(10)} Apple ${theirs}${rmse}`);
}

if (!component && !ids.length && !flags.sample) {
  const gaps = (await Promise.all(all.map((s) => graph.unlabeled(s)))).flat();

  const summary = {
    time: Date.now(),
    ...overall,
    components,
    motion: timings.map(({ id, component: owner, verdict, ...t }) => ({
      id,
      component: owner,
      verdict,
      ours: "ours" in t && t.ours ? { latency: t.ours.latency, duration: t.ours.duration } : null,
      apple: { latency: apple[id].latency, duration: apple[id].duration },
    })),
    states: Object.fromEntries(
      results.map((r) => [r.id, { reach: r.reach, why: r.why, steps: r.steps, failedAt: r.failedAt }]),
    ),
    gaps,
  };

  await Bun.write(join(dir, "summary.json"), JSON.stringify(summary, null, 1));

  if (gaps.length)
    console.log(`\n${gaps.length} taps the answer key's accessibility trees don't name:\n  ${gaps.join("\n  ")}`);

  if (out === mainOut) {
    await Bun.write(join(out, "small", "interact.json"), JSON.stringify(summary));
    await $`rsync -a ${join(out, "small", "interact.json")} ${pages}/camera-parity/interact.json`.quiet();
    await $`rsync -a ${join(import.meta.dir, "scoreboard.html")} ${pages}/camera-parity.html`.quiet();
  }
}
