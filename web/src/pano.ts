import type { Shot } from "./capture.ts";

/** Longest side of the stitched strip; a canvas of Apple's 63 MP does not fit in a browser. */
const reach = 8000;
const scan = 64;
const range = 12;
const every = 80;
const drifted = 0.12;

export type Axis = "x" | "y";

export type Hint = "too fast" | "move up" | "move down" | undefined;

export interface Panorama {
  /** The strip so far, as a canvas that fills its box from the starting side. */
  strip: HTMLCanvasElement;
  /** Share of the longest possible strip that is painted, 0 to 1. */
  progress: () => number;
  /** Sideways drift off the centre line, -1 to 1, positive when the phone drifted toward the screen's bottom. */
  drift: () => number;
  hint: () => Hint;
  stop: () => Promise<Shot | undefined>;
}

function gray(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = new Uint8Array(canvas.width * canvas.height);

  for (let i = 0; i < pixels.length; i++) pixels[i] = (data[i * 4] * 3 + data[i * 4 + 1] * 6 + data[i * 4 + 2]) / 10;

  return pixels;
}

/** How far the scene moved from `before` to `now` as (along, across), by the shifts that match best. */
function shift(before: Uint8Array, now: Uint8Array, width: number, height: number, axis: Axis) {
  let best = { along: 0, across: 0, cost: Number.POSITIVE_INFINITY };

  for (let a = -range; a <= range; a++) {
    for (let c = -range / 2; c <= range / 2; c++) {
      const dx = axis === "x" ? a : c;
      const dy = axis === "x" ? c : a;
      let cost = 0;
      let seen = 0;

      for (let y = Math.max(0, -dy); y < Math.min(height, height - dy); y += 2) {
        for (let x = Math.max(0, -dx); x < Math.min(width, width - dx); x += 2) {
          cost += Math.abs(before[(y + dy) * width + x + dx] - now[y * width + x]);
          seen++;
        }
      }

      cost /= seen || 1;

      if (cost < best.cost) best = { along: a, across: c, cost };
    }
  }

  return best;
}

/** Stitches the camera stream into a strip by laying down each new edge as the phone pans. `sign` is 1 toward the screen's right or bottom, -1 the other way. */
export function startPano(video: HTMLVideoElement, axis: Axis, sign: 1 | -1, onFull: () => void): Panorama {
  const wide = axis === "x";

  const frame = {
    along: wide ? video.videoWidth : video.videoHeight,
    across: wide ? video.videoHeight : video.videoWidth,
  };

  const scale = Math.min(1, 2000 / frame.across);
  const size = { along: Math.round(frame.along * scale), across: Math.round(frame.across * scale) };
  const small = document.createElement("canvas");
  small.width = wide ? scan : Math.round((scan * frame.across) / frame.along);
  small.height = wide ? Math.round((scan * frame.across) / frame.along) : scan;
  const smallAlong = wide ? small.width : small.height;

  const strip = document.createElement("canvas");
  strip.width = wide ? reach : size.across;
  strip.height = wide ? size.across : reach;
  const paint = strip.getContext("2d")!;

  let before = gray(video, small);
  let length = 0;
  let across = 0;
  let fast = false;

  const timer = setInterval(() => {
    const now = gray(video, small);
    const moved = shift(before, now, small.width, small.height, axis);
    before = now;
    fast = Math.abs(moved.along) >= range;
    across = Math.max(-1, Math.min(1, across + moved.across / small.height / 2));

    // A positive shift is the phone turning toward the screen's right or bottom.
    const advance = Math.round(Math.max(0, sign * moved.along) * (frame.along / smallAlong) * scale);

    if (!advance) return;

    const step = Math.min(advance, reach - length);
    const from = sign === 1 ? frame.along - step / scale : 0;
    const at = sign === 1 ? length : reach - length - step;

    paint.drawImage(
      video,
      wide ? from : 0,
      wide ? 0 : from,
      wide ? step / scale : frame.across,
      wide ? frame.across : step / scale,
      wide ? at : 0,
      wide ? 0 : at,
      wide ? step : size.across,
      wide ? size.across : step,
    );
    length += step;

    if (length >= reach) onFull();
  }, every);

  async function stop() {
    clearInterval(timer);

    if (!length) return undefined;

    const out = document.createElement("canvas");
    out.width = wide ? length : size.across;
    out.height = wide ? size.across : length;
    const start = sign === 1 ? 0 : reach - length;
    out
      .getContext("2d")!
      .drawImage(strip, wide ? start : 0, wide ? 0 : start, out.width, out.height, 0, 0, out.width, out.height);

    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.92));
    const file = new File([blob!], `PANO_${Date.now()}.jpg`, { type: "image/jpeg" });

    return { url: URL.createObjectURL(file), file };
  }

  return {
    strip,
    progress: () => length / reach,
    drift: () => across,
    hint: () => (fast ? "too fast" : across > drifted ? "move up" : across < -drifted ? "move down" : undefined),
    stop,
  };
}
