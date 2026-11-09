import type { ReactNode } from "react";

const moon = "M45 21.7A34 34 0 1 0 86.7 64A31 31 0 0 1 45 21.7Z";

const dots = [
  [57.8, 22.5],
  [71.3, 26.7],
  [56, 35.8],
  [70, 39],
  [82, 37],
  [61, 48],
  [73.7, 53],
  [86.2, 50.5],
] as const;

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="30" height="30" viewBox="10.5 9.5 90 90" fill="currentColor" aria-hidden>
      {children}
    </svg>
  );
}

const Dots = () => dots.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" />);

export const NightAuto = () => (
  <Glyph>
    <g transform="translate(-0.8 -0.8)">
      <path d={moon} />
    </g>
    <path
      d="M58.2 50.3 68.7 24.5 79.9 50.3M62.3 40h12.8"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.3"
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
  <Glyph>
    <path
      d="M25.6 38.1A35 35 0 0 0 66.3 79"
      fill="none"
      stroke="currentColor"
      strokeWidth="4.6"
    />
    <path
      d="M45.3 18.4 32.3 26.3 37.9 29.1 43.4 37.8ZM86.5 61 68.1 62.1 75.6 67.3 79.4 73.5Z"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <g transform="translate(0 -3.7)">
      <Dots />
    </g>
    <path d="M21.9 24.4 81.3 84" stroke="currentColor" strokeWidth="4.6" strokeLinecap="round" />
  </Glyph>
);
