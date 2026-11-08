import type { CSSProperties } from "react";
import type { Lighting } from "../../state.ts";

const dots = Array.from({ length: 15 }, (_, i) => {
  const turn = ((-90 + i * 24) * Math.PI) / 180;

  return [50 + 44.6 * Math.cos(turn), 50 + 44.6 * Math.sin(turn)] as const;
});

const looks: Record<Lighting, string> = {
  natural: "radial-gradient(circle, #fff 55%, #eee 75%, #d6d6d6 88%, #9a9a9a)",
  studio:
    "linear-gradient(#dbdbdb, #cdcdcd 20%, #c4c4c4 40%, #b4b4b4 50%, #a0a0a0 60%, #7e7e7e 75%, #6a6a6a 90%, #888)",
  contour:
    "linear-gradient(#f2f2f2 3%, #fff 10%, #e2e2e2 20%, #c9c9c9 30%, #b1b1b1 40%, #909090 50%, #6a6a6a 60%, #4e4e4e 70%, #4f4f4f 80%, #616161 90%, #adadad)",
  stage: "linear-gradient(#808080, #d0d0d0 12%, #7d7d7d 25%, #555 38%, #444 50%, #3a3a3a 62%, #4d4d4d 85%, #606060)",
  "stage-mono": "linear-gradient(#8a8a8a, #e0e0e0 12%, #8c8c8c 25%, #666 40%, #555 55%, #5a5a5a 75%, #707070)",
  "high-key-mono":
    "linear-gradient(#dbdbdb, #cdcdcd 20%, #c4c4c4 40%, #b4b4b4 50%, #a0a0a0 60%, #7e7e7e 75%, #6a6a6a 90%, #888)",
};

export function Ball({ effect, size }: { effect: Lighting; size: number }) {
  const style: CSSProperties = { width: size, height: size };

  return (
    <span className="lighting-ball" style={style}>
      {effect === "natural" && (
        <svg viewBox="0 0 100 100" aria-hidden>
          {dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.5} fill="#e4e4e6" />
          ))}
        </svg>
      )}
      <i style={{ background: looks[effect] }} />
    </span>
  );
}

const outline = "50,2 91.6,26 91.6,74 50,98 8.4,74 8.4,26";

export function CubeFace({ size, lit }: { size: number; lit: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      {lit ? (
        <>
          <defs>
            <linearGradient id="lighting-left" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.3" stopColor="#555551" />
              <stop offset="1" stopColor="#cfcfcd" />
            </linearGradient>
            <linearGradient id="lighting-right" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0.3" stopColor="#565552" />
              <stop offset="1" stopColor="#6f6f6b" />
            </linearGradient>
          </defs>
          <polygon points="50,2 91.6,26 50,50 8.4,26" fill="#bababa" />
          <polygon points="8.4,26 50,50 50,98 8.4,74" fill="url(#lighting-left)" />
          <polygon points="91.6,26 50,50 50,98 91.6,74" fill="url(#lighting-right)" />
        </>
      ) : (
        <polygon points={outline} fill="rgb(0 0 0 / 0.4)" />
      )}
    </svg>
  );
}

export function CubeEdges({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <g fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
        <polygon points={outline} />
        <path d="M8.4 26 50 50 91.6 26M50 50v48" />
      </g>
    </svg>
  );
}
