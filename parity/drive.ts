import { join } from "node:path";
import type { Browser, BrowserContext, CDPSession, Locator, Page } from "playwright";
import type { Settings } from "../web/src/state.ts";
import type { Launch, Step } from "./graph.ts";
import type { State } from "./states.ts";

const frame = 1000 / 60;
const roles = ["button", "slider", "img", "region", "tab", "radio", "switch", "checkbox", "link"] as const;
const shutter = /^(take picture|record .*|stop .*)$/i;
const dial = ["TIME-LAPSE", "SLO-MO", "CINEMATIC", "VIDEO", "PHOTO", "PORTRAIT", "PANO"];

declare global {
  interface Window {
    camera?: Settings;
  }
}

const exactly = (label: string) => new RegExp(`^${label.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

/** Chromium's fake camera showing one still frame in the simulator placeholder's gray (#8F8F94). */
export async function camera(dir: string) {
  const [width, height] = [64, 48];
  const file = join(dir, "feed.y4m");
  const header = `YUV4MPEG2 W${width} H${height} F30:1 Ip A1:1 C420jpeg\nFRAME\n`;

  const planes = [
    Buffer.alloc(width * height, 144),
    Buffer.alloc((width * height) / 4, 130),
    Buffer.alloc((width * height) / 4, 128),
  ];

  await Bun.write(file, Buffer.concat([Buffer.from(header), ...planes]));

  return [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-video-capture=${file}`,
  ];
}

export interface Driver {
  page: Page;
  context: BrowserContext;
  cdp: CDPSession;
}

export function phone(browser: Browser, state: State) {
  const { widthPt: width, heightPt: height, scale } = state.screen;

  return browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, hasTouch: true, isMobile: true });
}

/** The real interactive app on Apple's gray plate, with a fake camera and a paused clock that only steps move. */
export async function open(browser: Browser, url: URL, state: State, launch: Launch, plate = state.id) {
  const context = await phone(browser, state);
  const page = await context.newPage();

  if (launch.camera === "denied") {
    await page.addInitScript(() => {
      navigator.mediaDevices.getUserMedia = () =>
        Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
    });
  }

  await page.clock.install({ time: new Date("2026-11-08T09:41:00") });
  await page.clock.pauseAt(new Date("2026-11-08T10:41:00"));
  await page.goto(new URL(`/?live=${state.id}`, url).href);
  await page.waitForFunction(() => window.camera && document.fonts.status === "loaded", null, { polling: 50 });

  await page.addStyleTag({
    content: `.screen { background: #000 url(/plates/${plate}.png) 0 0 / 100% 100% !important }
      .viewfinder { background: none !important }
      .viewfinder video { visibility: hidden }`,
  });

  await settle(page);

  return { page, context, cdp: await context.newCDPSession(page) };
}

export async function settle(page: Page) {
  await page.waitForTimeout(40);
  await page.evaluate(() => {
    for (const a of document.getAnimations()) {
      if (Number.isFinite(a.effect?.getComputedTiming().endTime)) a.finish();
    }
  });
}

export const settings = (page: Page) => page.evaluate(() => window.camera);

export const snapshot = (page: Page) =>
  page.evaluate(() => JSON.stringify(window.camera) + document.querySelector("main")?.outerHTML);

function named(page: Page, pattern: RegExp) {
  return roles
    .map((role) => page.getByRole(role, { name: pattern }))
    .reduce((all, next) => all.or(next))
    .filter({ visible: true });
}

async function center(target: Locator) {
  const box = await target.boundingBox();

  if (!box) return;

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Where a tap on the element lands, or what covers it. */
async function aim(target: Locator) {
  const at = await center(target);

  if (!at) return { miss: "it has no box" };

  const cover = await target.evaluate((el, { x, y }) => {
    const hit = document.elementFromPoint(x, y);

    if (!hit) return "nothing at all";

    return el.contains(hit) ? "" : `${hit.tagName.toLowerCase()}.${[...hit.classList].join(".")}`;
  }, at);

  return cover ? { miss: `it's covered by ${cover}` } : at;
}

async function find(page: Page, name: string) {
  const matches = named(page, name === "shutter" ? shutter : exactly(name));

  return (await matches.count()) ? matches.last() : undefined;
}

async function tap(page: Page, target: Locator) {
  const at = await aim(target);

  if ("miss" in at) return at.miss;

  await page.touchscreen.tap(at.x, at.y);
}

type Touch = { x: number; y: number }[];

async function touch(driver: Driver, type: "touchStart" | "touchMove" | "touchEnd", points: Touch) {
  await driver.cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: type === "touchEnd" ? [] : points.map((p, id) => ({ ...p, id })),
  });
}

async function gesture(driver: Driver, from: Touch, to: Touch, ms: number) {
  const frames = Math.max(1, Math.round(ms / frame));

  for (let i = 1; i <= frames; i++) {
    const k = i / frames;
    await touch(
      driver,
      "touchMove",
      from.map((p, j) => ({ x: p.x + (to[j].x - p.x) * k, y: p.y + (to[j].y - p.y) * k })),
    );
    await driver.page.clock.runFor(frame);
  }
}

async function swipeDial(driver: Driver, toward: number) {
  const { page } = driver;

  const wheel = await page.evaluate(() => {
    const el = document.querySelector('[aria-label="Camera Mode"]');
    const box = el?.getBoundingClientRect();

    return (
      box && {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        turn: Number.parseFloat(getComputedStyle(el!).rotate) || 0,
      }
    );
  });

  if (!wheel) return "there is no mode dial";

  const angle = (wheel.turn * Math.PI) / 180;
  const at = { x: wheel.x, y: wheel.y };
  const to = { x: at.x + 80 * toward * Math.cos(angle), y: at.y + 80 * toward * Math.sin(angle) };
  await touch(driver, "touchStart", [at]);
  await gesture(driver, [at], [to], 200);
  await touch(driver, "touchEnd", []);
}

async function switchMode(driver: Driver, label: string) {
  const { page } = driver;
  const current = async () => dial.indexOf((await settings(page))?.mode.toUpperCase() ?? "");
  const goal = dial.indexOf(label);

  for (let hop = 0; hop < dial.length; hop++) {
    const from = await current();

    if (hop) await settle(page);

    if (from === goal) return;

    const candidates = dial.slice(Math.min(from, goal), Math.max(from, goal) + 1).filter((l) => l !== dial[from]);
    const target = await nearest(page, goal > from ? candidates.toReversed() : candidates);

    if (target) await tap(page, target);
    else await swipeDial(driver, goal > from ? -1 : 1);

    await page.waitForTimeout(40);
  }

  return `tapping mode labels never reached ${label}`;
}

async function nearest(page: Page, labels: string[]) {
  for (const label of labels) {
    const target = await find(page, label);

    if (target && !("miss" in (await aim(target)))) return target;
  }
}

async function zoomStops(page: Page) {
  const stops = page.getByRole("button", { name: /^\.?\d+(\.\d+)?×?$/ }).filter({ visible: true });

  return Promise.all(
    (await stops.all()).map(async (stop) => ({
      stop,
      value: Number.parseFloat((await stop.innerText()).replace("×", "")),
      on: (await stop.innerText()).includes("×"),
    })),
  );
}

/** Performs one step, or says why it can't. */
export async function perform(driver: Driver, step: Step): Promise<string | undefined> {
  const { page } = driver;

  if ("wait" in step) return void (await page.clock.runFor(step.wait));

  if ("mode" in step) return switchMode(driver, step.mode);

  if ("tap" in step) {
    const target = await find(page, step.tap);

    if (!target) return step.optional ? undefined : `nothing named "${step.tap}"`;

    const missed = await tap(page, target);

    return missed && `can't tap "${step.tap}": ${missed}`;
  }

  if ("firstOf" in step) {
    for (const name of step.firstOf) {
      const target = await find(page, name);

      if (target) return tap(page, target);
    }

    return;
  }

  if ("point" in step) return void (await page.touchscreen.tap(...step.point));

  if ("zoom" in step) {
    const value = Number.parseFloat(step.zoom.replace("×", ""));
    const stop = (await zoomStops(page)).find((s) => s.value === value);

    if (!stop) return `no zoom stop ${step.zoom}`;

    return tap(page, stop.stop);
  }

  if ("swipe" in step) {
    const stops = await zoomStops(page);
    const on = stops.find((s) => s.on) ?? stops[0];
    const at = on && (await center(on.stop));

    if (!at) return "no zoom stops";

    const other = stops.find((s) => s !== on);
    const across = other ? await center(other.stop) : undefined;
    const vertical = !!across && Math.abs(across.y - at.y) > Math.abs(across.x - at.x);
    const to = vertical ? { x: at.x, y: at.y - 50 } : { x: at.x - 50, y: at.y };
    await touch(driver, "touchStart", [at]);
    await gesture(driver, [at], [to], 500);
    await page.clock.runFor(300);
    await touch(driver, "touchEnd", []);

    return;
  }

  if ("pinch" in step) {
    const viewfinder = await find(page, "Viewfinder");
    const at = viewfinder ? await center(viewfinder) : { x: page.viewportSize()!.width / 2, y: 200 };

    if (!at) return "no viewfinder";

    const zoom = (await settings(page))?.zoom ?? 1;

    const spread = (d: number) => [
      { x: at.x - d, y: at.y },
      { x: at.x + d, y: at.y },
    ];

    await touch(driver, "touchStart", spread(40));
    await gesture(driver, spread(40), spread((40 * step.pinch) / zoom), 400);
    await touch(driver, "touchEnd", []);

    const scale = await page.evaluate(() => visualViewport?.scale ?? 1);

    return scale === 1 ? undefined : `the pinch zoomed the page to ${scale.toFixed(2)}×`;
  }

  if ("adjust" in step) {
    const sliders = page
      .getByRole("slider", { name: step.adjust ? exactly(step.adjust) : /^(?!Lighting$)/ })
      .filter({ visible: true });

    if (!(await sliders.count())) return `no slider${step.adjust ? ` named "${step.adjust}"` : ""}`;

    await sliders.last().focus();

    for (let i = 0; i < Math.abs(step.by); i++) await page.keyboard.press(step.by > 0 ? "ArrowUp" : "ArrowDown");

    return;
  }

  const target = await find(page, step.press);

  if (!target) return `nothing named "${step.press}"`;

  const at = await aim(target);

  if ("miss" in at) return `can't press "${step.press}": ${at.miss}`;

  await touch(driver, "touchStart", [at]);
  await page.clock.runFor(step.hold);

  if (step.slide) await gesture(driver, [at], [{ x: at.x + step.slide, y: at.y }], 600);

  if (step.release) await touch(driver, "touchEnd", []);
}

/** Steps a transition frame by frame: CSS animations are paused and moved by hand, timers by the clock. */
export async function film(driver: Driver, trigger: () => Promise<void>, seconds: number) {
  const { page } = driver;
  const shots: Buffer[] = [await page.screenshot({ scale: "css" })];
  await trigger();

  for (let k = 0; k < seconds * 60; k++) {
    await page.evaluate(
      ({ k: at, frame: ms }) => {
        for (const a of document.getAnimations()) {
          a.id ||= String(at);
          a.pause();
          a.currentTime = (at - Number(a.id)) * ms;
        }
      },
      { k, frame },
    );
    shots.push(await page.screenshot({ scale: "css" }));
    await page.clock.runFor(frame);
  }

  return shots;
}
