import { PNG } from "pngjs";

const shrink = 6;
const step = 4;
const radius = 70;

export function plate(image: PNG) {
  const { width, height, data } = image;
  const sw = Math.floor(width / shrink);
  const sh = Math.floor(height / shrink);
  const small = new Float32Array(sw * sh * 3);

  for (let y = 0; y < sh * shrink; y++) {
    for (let x = 0; x < sw * shrink; x++) {
      const from = (y * width + x) * 4;
      const to = (Math.floor(y / shrink) * sw + Math.floor(x / shrink)) * 3;

      for (let c = 0; c < 3; c++) small[to + c] += data[from + c] / (shrink * shrink);
    }
  }

  const gw = Math.ceil(sw / step) + 1;
  const gh = Math.ceil(sh / step) + 1;
  const cells = new Float32Array(gw * gh * 3);

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const channels: number[][] = [[], [], []];

      for (let y = Math.max(0, gy * step - radius); y < Math.min(sh, gy * step + radius); y += 3) {
        for (let x = Math.max(0, gx * step - radius); x < Math.min(sw, gx * step + radius); x += 3) {
          for (let c = 0; c < 3; c++) channels[c].push(small[(y * sw + x) * 3 + c]);
        }
      }

      for (let c = 0; c < 3; c++) {
        const sorted = Float32Array.from(channels[c]).sort();
        cells[(gy * gw + gx) * 3 + c] = sorted[sorted.length >> 1];
      }
    }
  }

  const result = new PNG({ width, height });
  const cell = shrink * step;

  for (let y = 0; y < height; y++) {
    const fy = Math.min(y / cell, gh - 1.001);
    const y0 = Math.floor(fy);

    for (let x = 0; x < width; x++) {
      const fx = Math.min(x / cell, gw - 1.001);
      const x0 = Math.floor(fx);
      const at = (cx: number, cy: number, c: number) => cells[(cy * gw + cx) * 3 + c];

      for (let c = 0; c < 3; c++) {
        const top = at(x0, y0, c) * (x0 + 1 - fx) + at(x0 + 1, y0, c) * (fx - x0);
        const bottom = at(x0, y0 + 1, c) * (x0 + 1 - fx) + at(x0 + 1, y0 + 1, c) * (fx - x0);
        result.data[(y * width + x) * 4 + c] = top * (y0 + 1 - fy) + bottom * (fy - y0);
      }

      result.data[(y * width + x) * 4 + 3] = 255;
    }
  }

  return result;
}
