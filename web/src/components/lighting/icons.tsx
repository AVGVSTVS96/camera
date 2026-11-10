import type { CSSProperties, ReactNode } from "react";
import type { Lighting } from "../../state.ts";

const dots = Array.from({ length: 15 }, (_, i) => {
  const turn = ((-90 + i * 24) * Math.PI) / 180;

  return [50 + 50 * Math.cos(turn), 50 + 50 * Math.sin(turn)] as const;
});

interface Look {
  body: string;
  gloss: string;
  mask?: string;
}

const studio: Look = {
  body: "linear-gradient(#dbdbdb, #cdcdcd 20%, #c4c4c4 40%, #b4b4b4 50%, #a0a0a0 60%, #7e7e7e 75%, #6a6a6a 90%, #888)",
  gloss:
    "radial-gradient(55% 16% at 50% 99%, rgb(255 255 255 / 0.4), transparent), radial-gradient(circle, transparent 52%, rgb(0 0 0 / 0.3) 94%, rgb(0 0 0 / 0.1))",
};

const looks: Record<Lighting, Look> = {
  natural: {
    body: "radial-gradient(50% 60% at 50% 36%, #fefefe, #fbfbfb 30%, #f7f7f7 42%, #f0f0f0 53%, #e2e2e2 64%, #cbcbcb 75%, #a7a7a7 87%, #8d8d8d 98%)",
    gloss:
      "radial-gradient(40% 25% at 50% 88%, rgb(200 200 200 / 0.35), transparent), radial-gradient(closest-side, transparent 94%, rgb(60 60 60 / 0.5))",
  },
  studio,
  contour: {
    body: "linear-gradient(90deg, rgb(30 30 30 / 0.75), rgb(30 30 30 / 0.84) 8%, rgb(30 30 30 / 0.56) 18%, rgb(30 30 30 / 0.31) 27%, transparent 40% 60%, rgb(30 30 30 / 0.31) 73%, rgb(30 30 30 / 0.56) 82%, rgb(30 30 30 / 0.84) 92%, rgb(30 30 30 / 0.75)), linear-gradient(#fff 13%, #f3f3f3 17%, #ddd 26%, #c7c7c7 36%, #a9a9a9 45%, #7c7c7c 55%, #333 64%, #222 74%, #2d2d2d 83%, #686868 92%, #999 96%)",
    mask: "linear-gradient(#000 13%, rgb(0 0 0 / 0.97) 17%, rgb(0 0 0 / 0.91) 26%, rgb(0 0 0 / 0.86) 36%, rgb(0 0 0 / 0.8) 45%, rgb(0 0 0 / 0.73) 55%, rgb(0 0 0 / 0.63) 64%, rgb(0 0 0 / 0.61) 74%, rgb(0 0 0 / 0.63) 83%, rgb(0 0 0 / 0.69) 92%, rgb(0 0 0 / 0.84) 96%)",
    gloss:
      "radial-gradient(closest-side, transparent 93%, rgb(40 40 40 / 0.6)), radial-gradient(65% 30% at 50% 0%, #fff 50%, rgb(255 255 255 / 0.6) 75%, transparent), radial-gradient(30% 8% at 50% 100%, rgb(200 200 200 / 0.95), transparent)",
  },
  stage: {
    body: "radial-gradient(closest-side, #323232, #353535 42%, #414141 53%, #4f4f4f 64%, #525252 75%, #2c2c2c 87%, #5a5a5a 96%, #707070)",
    gloss:
      "radial-gradient(70% 50% at 50% 0%, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.95) 13%, rgb(255 255 255 / 0.64) 25%, rgb(255 255 255 / 0.39) 36%, rgb(255 255 255 / 0.23) 47%, rgb(255 255 255 / 0.17) 58%, rgb(255 255 255 / 0.13) 70%, rgb(255 255 255 / 0.1) 81%, transparent), radial-gradient(45% 20% at 50% 100%, rgb(200 200 200 / 0.7) 15%, rgb(200 200 200 / 0.24) 42%, transparent 70%)",
  },
  "stage-mono": {
    body: "radial-gradient(closest-side, #484848, #4c4c4c 30%, #525252 42%, #5a5a5a 53%, #626262 64%, #5b5b5b 75%, #3e3e3e 87%, #505050)",
    gloss:
      "radial-gradient(closest-side, transparent 90%, rgb(25 25 25 / 0.4) 97%, rgb(25 25 25 / 0.2)), radial-gradient(70% 26% at 50% 0%, #fff 25%, rgb(255 255 255 / 0.9) 45%, rgb(255 255 255 / 0.35) 70%, transparent 95%), radial-gradient(40% 20% at 50% 100%, rgb(200 200 200 / 0.9) 20%, rgb(150 150 150 / 0.3) 60%, transparent)",
  },
  "high-key-mono": studio,
};

export function Dots({ radius }: { radius: number }) {
  return (
    <svg className="lighting-dots" viewBox="0 0 100 100" aria-hidden>
      {dots.map(([x, y], i) => (
        <circle key={i} cx={50 + (x - 50) * radius} cy={50 + (y - 50) * radius} r={3} fill="#d4d4d6" />
      ))}
    </svg>
  );
}

export function Ball({
  effect,
  size,
  ring,
  turn = 0,
}: {
  effect: Lighting;
  size: number;
  ring: number;
  turn?: number;
}) {
  const style: CSSProperties = { width: size, height: size, rotate: `${turn}deg` };

  return (
    <span className="lighting-ball" style={style}>
      {effect === "natural" && <Dots radius={ring / size} />}
      <i style={{ background: looks[effect].body, maskImage: looks[effect].mask }} />
      <b style={{ background: looks[effect].gloss }} />
    </span>
  );
}

const RX = 19.15;
const RY = 18.8;

const hex = [0, 1, 2, 3, 4, 5].map((k) => {
  const turn = ((k * 60 - 90) * Math.PI) / 180;

  return [RX * Math.cos(turn), RY * Math.sin(turn)] as const;
});

const [top, upperRight, lowerRight, bottom, lowerLeft, upperLeft] = hex;
const pts = (...p: (readonly [number, number])[]) => p.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

function rounded(r: number) {
  return (
    hex
      .map(([x, y], i) => {
        const [px, py] = hex[(i + 5) % 6];
        const [nx, ny] = hex[(i + 1) % 6];
        const a = Math.hypot(px - x, py - y);
        const b = Math.hypot(nx - x, ny - y);
        const from = `${(x + ((px - x) * r) / a).toFixed(2)} ${(y + ((py - y) * r) / a).toFixed(2)}`;
        const to = `${(x + ((nx - x) * r) / b).toFixed(2)} ${(y + ((ny - y) * r) / b).toFixed(2)}`;

        return `${i ? "L" : "M"}${from}Q${x.toFixed(2)} ${y.toFixed(2)} ${to}`;
      })
      .join("") + "Z"
  );
}

const outline = rounded(2.2);

const spoke = ([x, y]: readonly [number, number]) => {
  const reach = 1 - 1.4 / Math.hypot(x, y);

  return `${(x * reach).toFixed(2)} ${(y * reach).toFixed(2)}`;
};

function Glyph({ turn, scale, children }: { turn: number; scale: number; children: ReactNode }) {
  return (
    <svg width={44 * scale} height={44 * scale} viewBox="-22 -22 44 44" aria-hidden style={{ rotate: `${turn}deg` }}>
      {children}
    </svg>
  );
}

type Shade = readonly [
  topLeft: number,
  topRight: number,
  wedgeLeft: number,
  wedgeRight: number,
  lower: number,
  veil?: number,
];

// Gray levels of Apple's translucent faces, so a black viewfinder darkens them the way it does there.
const shades: Record<Exclude<Lighting, "natural">, Shade> = {
  studio: [200, 217, 223, 227, 249],
  contour: [230, 235, 152, 155, 239],
  stage: [88, 105, 84, 96, 232],
  "stage-mono": [88, 105, 84, 96, 232],
  "high-key-mono": [230, 255, 232, 255, 109, 0.95],
};

const veil = (level: number, alpha: number) => `rgb(${level} ${level} ${level} / ${alpha})`;

export function CubeFaces({ turn, scale, effect }: { turn: number; scale: number; effect: Lighting }) {
  const shade = effect === "natural" ? undefined : shades[effect];
  const [topLeft = 0, topRight = 0, wedgeLeft = 0, wedgeRight = 0, lower = 0, sheer] = shade ?? [];
  const topAlpha = sheer ?? 0.888;
  const wedgeAlpha = sheer ?? 0.664;

  return (
    <Glyph turn={turn} scale={scale}>
      <defs>
        <clipPath id="lighting-clip">
          <path d={outline} />
        </clipPath>
        <linearGradient id="lighting-top" x1="0" x2="1">
          <stop offset="0" stopColor={veil(topLeft, topAlpha)} />
          <stop offset="0.5" stopColor={veil(topLeft, topAlpha)} />
          <stop offset="0.5" stopColor={veil(topRight, topAlpha)} />
          <stop offset="1" stopColor={veil(topRight, topAlpha)} />
        </linearGradient>
        <radialGradient id="lighting-cloud" cx="0" cy="6.5" r="6.5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3c3c3c" stopOpacity="0.6" />
          <stop offset="1" stopColor="#3c3c3c" stopOpacity="0" />
        </radialGradient>
        <filter id="lighting-soft">
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
      </defs>
      <g clipPath="url(#lighting-clip)">
        {shade ? (
          <>
            <polygon points={pts([0, 0], upperLeft, top, upperRight)} fill="url(#lighting-top)" />
            <polygon points={pts([0, 0], upperLeft, lowerLeft)} fill={veil(wedgeLeft, wedgeAlpha)} />
            <polygon points={pts([0, 0], upperRight, lowerRight)} fill={veil(wedgeRight, wedgeAlpha)} />
            <polygon points={pts([0, 0], lowerLeft, bottom, lowerRight)} fill={veil(lower, 0.874)} />
            <g fill="none" stroke="#ffe27a" strokeWidth="1.6" filter="url(#lighting-soft)">
              {effect === "contour" && <polyline points={pts(upperLeft, [0, 0], upperRight)} strokeOpacity="0.27" />}
              <polyline points={pts(lowerLeft, [0, 0], lowerRight)} strokeOpacity="0.38" />
            </g>
            <rect x="-8" y="0" width="16" height="12" fill="url(#lighting-cloud)" />
          </>
        ) : (
          <path d={outline} fill="#000" fillOpacity="0.4" />
        )}
      </g>
    </Glyph>
  );
}

export function CubeLines({ turn, scale }: { turn: number; scale: number }) {
  const spokes = `M${spoke(upperLeft)}L0 0 ${spoke(upperRight)}M0 0 ${spoke(bottom)}`;

  return (
    <Glyph turn={turn} scale={scale}>
      <g fill="none" stroke="#fff" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d={outline} />
        <path d={spokes} />
      </g>
    </Glyph>
  );
}
