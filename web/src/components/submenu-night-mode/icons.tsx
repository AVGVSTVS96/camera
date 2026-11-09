import type { ReactNode } from "react";

const moon = "M20.76 16.06A9 9 0 1 1 9.94 5.24A8 8 0 0 0 20.76 16.06Z";

const dots = [
  [16.5, 4.5, 1.1],
  [20, 6, 1.1],
  [22.5, 9.5, 1.1],
  [18.5, 8.5, 1],
  [21.5, 13, 1],
  [14.5, 7.5, 0.9],
  [17.5, 12, 0.9],
] as const;

function Glyph({ children, box = "2 2.5 22 22" }: { children: ReactNode; box?: string }) {
  return (
    <svg width="26" height="26" viewBox={box} fill="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

const Dots = () => dots.map(([cx, cy, r]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />);

export const NightAuto = () => (
  <Glyph>
    <path d={moon} />
    <path
      d="M15.5 11.5 18.2 4.5 20.9 11.5M16.5 9.2h3.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Glyph>
);

export const NightMax = () => (
  <Glyph>
    <path d={moon} />
    <Dots />
  </Glyph>
);

export const NightOff = () => (
  <Glyph box="0 0.5 26 26">
    <path
      d="M20.76 16.06A9 9 0 1 1 9.94 5.24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <Dots />
    <path d="M3.5 3.5 23 23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </Glyph>
);
