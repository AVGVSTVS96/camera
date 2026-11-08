import type { CSSProperties, ReactNode } from "react";
import type { Lighting } from "../../state.ts";

const dots = Array.from({ length: 15 }, (_, i) => {
  const turn = ((-90 + i * 24) * Math.PI) / 180;

  return [50 + 50 * Math.cos(turn), 50 + 50 * Math.sin(turn)] as const;
});

const looks: Record<Lighting, string> = {
  natural:
    "radial-gradient(circle at 50% 78%, #fff 22%, rgb(255 255 255 / 0.85) 45%, rgb(255 255 255 / 0.4) 75%, rgb(255 255 255 / 0.12))",
  studio:
    "linear-gradient(#dbdbdb, #cdcdcd 20%, #c4c4c4 40%, #b4b4b4 50%, #a0a0a0 60%, #7e7e7e 75%, #6a6a6a 90%, #888)",
  contour:
    "linear-gradient(#f2f2f2 3%, #fff 10%, #e2e2e2 20%, #c9c9c9 30%, #b1b1b1 40%, #909090 50%, #6a6a6a 60%, #4e4e4e 70%, #4f4f4f 80%, #616161 90%, #adadad)",
  stage: "linear-gradient(#808080, #d0d0d0 12%, #7d7d7d 25%, #555 38%, #444 50%, #3a3a3a 62%, #4d4d4d 85%, #606060)",
  "stage-mono": "linear-gradient(#8a8a8a, #e0e0e0 12%, #8c8c8c 25%, #666 40%, #555 55%, #5a5a5a 75%, #707070)",
  "high-key-mono":
    "linear-gradient(#dbdbdb, #cdcdcd 20%, #c4c4c4 40%, #b4b4b4 50%, #a0a0a0 60%, #7e7e7e 75%, #6a6a6a 90%, #888)",
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
      <i style={{ background: looks[effect] }} />
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

type Shade = readonly [topLeft: number, topRight: number, wedgeLeft: number, wedgeRight: number, lower: number];

// Gray levels of Apple's translucent faces, so a black viewfinder darkens them the way it does there.
const shades: Record<Exclude<Lighting, "natural">, Shade> = {
  studio: [200, 217, 223, 227, 249],
  contour: [230, 235, 152, 155, 239],
  stage: [88, 105, 84, 96, 232],
  "stage-mono": [88, 105, 84, 96, 232],
  "high-key-mono": [235, 255, 255, 255, 109],
};

const veil = (level: number, alpha: number) => `rgb(${level} ${level} ${level} / ${alpha})`;

export function CubeFaces({ turn, scale, effect }: { turn: number; scale: number; effect: Lighting }) {
  const shade = effect === "natural" ? undefined : shades[effect];
  const [topLeft = 0, topRight = 0, wedgeLeft = 0, wedgeRight = 0, lower = 0] = shade ?? [];

  return (
    <Glyph turn={turn} scale={scale}>
      <defs>
        <clipPath id="lighting-clip">
          <path d={outline} />
        </clipPath>
        <linearGradient id="lighting-top" x1="0" x2="1">
          <stop offset="0" stopColor={veil(topLeft, 0.888)} />
          <stop offset="1" stopColor={veil(topRight, 0.888)} />
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
            <polygon points={pts([0, 0], upperLeft, lowerLeft)} fill={veil(wedgeLeft, 0.664)} />
            <polygon points={pts([0, 0], upperRight, lowerRight)} fill={veil(wedgeRight, 0.664)} />
            <polygon points={pts([0, 0], lowerLeft, bottom, lowerRight)} fill={veil(lower, 0.874)} />
            <g fill="none" stroke="#ffe27a" strokeOpacity="0.55" strokeWidth="1.6" filter="url(#lighting-soft)">
              {effect === "contour" && <polyline points={pts(upperLeft, [0, 0], upperRight)} />}
              <polyline points={pts(lowerLeft, [0, 0], lowerRight)} />
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
