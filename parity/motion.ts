import { join } from "node:path";
import { PNG } from "pngjs";
import type { Step } from "./graph.ts";
import { key } from "./paths.ts";

export interface Transition {
  id: string;
  component: string;
  from: string;
  trigger: Step | { unfold: string };
}

export const transitions: Transition[] = [
  { id: "controls-panel-open", component: "controls-panel", from: "default", trigger: { tap: "Camera Controls" } },
  { id: "controls-panel-expand", component: "controls-panel", from: "controls-open", trigger: { tap: "Expand" } },
  {
    id: "controls-panel-close",
    component: "controls-panel",
    from: "controls-expanded",
    trigger: { tap: "Dismiss Camera Controls" },
  },
  { id: "controls-submenu-open", component: "submenu-flash", from: "controls-open", trigger: { tap: "Flash" } },
  { id: "controls-submenu-back", component: "submenu-flash", from: "flash-submenu", trigger: { tap: "Back" } },
  { id: "mode-switch-photo-to-video", component: "mode-dial", from: "default", trigger: { mode: "VIDEO" } },
  { id: "mode-switch-photo-to-portrait", component: "mode-dial", from: "default", trigger: { mode: "PORTRAIT" } },
  { id: "shutter-photo", component: "shutter", from: "default", trigger: { tap: "shutter" } },
  { id: "record-start-video", component: "shutter", from: "video:default", trigger: { tap: "shutter" } },
  { id: "camera-flip", component: "flip", from: "default", trigger: { tap: "Camera Chooser" } },
  { id: "zoom-dial-open", component: "zoom", from: "default", trigger: { swipe: "zoom" } },
  { id: "zoom-ramp-0.5-to-1.3", component: "zoom", from: "default", trigger: { zoom: "1" } },
  {
    id: "unfold-outer-to-inner",
    component: "inner-layout",
    from: "default",
    trigger: { unfold: "photo-inner-landscape-default" },
  },
];

export const fromState = ({ from }: Transition) => {
  const [mode, rest] = from.includes(":") ? from.split(":") : ["photo", from];

  return `${mode}-outer-portrait-${rest}`;
};

export interface Timing {
  latency: number;
  duration: number;
  progress: [number, number][];
}

interface Apple extends Timing {
  roiPt: [number, number, number, number] | null;
}

export const apple: Record<string, Apple> = await Bun.file(join(key, "motion.json")).json();

const width = 96;

/** Grayscale at 96 px wide, all frames sampled to the last frame's size so a resize can be compared. */
function grays(shots: Buffer[], roi: Apple["roiPt"]) {
  const images = shots.map((s) => PNG.sync.read(s));
  const last = images.at(-1)!;
  const [x0, y0, x1, y1] = roi ?? [0, 0, last.width, last.height];
  const height = Math.round((width * (y1 - y0)) / (x1 - x0));

  return images.map((image) => {
    const gray = new Float32Array(width * height);
    const sx = image.width / last.width;
    const sy = image.height / last.height;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = Math.min(image.width - 1, Math.floor((x0 + ((x + 0.5) * (x1 - x0)) / width) * sx));
        const py = Math.min(image.height - 1, Math.floor((y0 + ((y + 0.5) * (y1 - y0)) / height) * sy));
        const i = (py * image.width + px) * 4;
        gray[y * width + x] = 0.299 * image.data[i] + 0.587 * image.data[i + 1] + 0.114 * image.data[i + 2];
      }
    }

    return gray;
  });
}

const distance = (a: Float32Array, b: Float32Array) => a.reduce((sum, v, i) => sum + Math.abs(v - b[i]), 0) / a.length;

/** motion.py's measure: the first run of change after the action, ending at the first 250 ms without change. */
export function measure(shots: Buffer[], roi: Apple["roiPt"]): Timing | undefined {
  const frames = grays(shots, roi);
  const times = frames.map((_, i) => (i - 1) / 60);
  const deltas = frames.map((f, i) => (i ? distance(frames[i - 1], f) : 0));
  const threshold = Math.max(0.05, 0.1 * Math.max(...deltas));
  const moving = deltas.flatMap((d, i) => (d > threshold ? [i] : []));

  if (!moving.length) return;

  const run = [moving[0]];

  for (const i of moving.slice(1)) {
    if (times[i] - times[run.at(-1)!] > 0.25) break;
    run.push(i);
  }

  const first = run[0] - 1;
  const last = run.at(-1)!;
  const start = times[first];
  const [a, b] = [frames[first], frames[last]];

  const progress = frames.slice(first, last + 1).map((f, i): [number, number] => {
    const [da, db] = [distance(a, f), distance(f, b)];

    return [i / 60, da + db ? da / (da + db) : 1];
  });

  return { latency: Math.max(0, start), duration: times[last] - start, progress };
}

function at(curve: [number, number][], t: number) {
  const i = curve.findIndex(([x]) => x >= t);

  if (i <= 0) return i ? curve.at(-1)![1] : curve[0][1];

  const [[t0, p0], [t1, p1]] = [curve[i - 1], curve[i]];

  return p0 + ((p1 - p0) * (t - t0)) / (t1 - t0 || 1);
}

/** Root mean square gap between the two progress curves, each over its own duration. */
export function curveGap(ours: Timing, theirs: Timing) {
  const gaps = theirs.progress.map(([t, p]) => p - at(ours.progress, (t / (theirs.duration || 1)) * ours.duration));

  return Math.sqrt(gaps.reduce((sum, g) => sum + g * g, 0) / gaps.length);
}

export function judge(ours: Timing | undefined, theirs: Timing) {
  if (!ours) return { verdict: "missing" as const };

  const rmse = curveGap(ours, theirs);
  const close = Math.abs(ours.duration - theirs.duration) <= Math.max(0.15 * theirs.duration, 2 / 60);

  return { verdict: close && rmse <= 0.1 ? ("matches" as const) : ("differs" as const), rmse };
}
