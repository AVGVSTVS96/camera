import type { ReactNode } from "react";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      width="30"
      height="30"
      viewBox="-15 -15 30 30"
      fill="none"
      stroke="currentColor"
      overflow="visible"
      aria-hidden
    >
      <circle r="11.5" strokeWidth="1.2" strokeDasharray="0.1 1.95" strokeLinecap="round" />
      {children}
    </svg>
  );
}

export const On = () => (
  <Glyph>
    <circle r="8" strokeWidth="1.6" />
    <circle r="3.2" strokeWidth="2" />
  </Glyph>
);

export const Off = () => (
  <Glyph>
    <circle r="8" strokeWidth="1.6" />
    <circle r="3.2" strokeWidth="2" />
    <path d="M-10 -10 10 10" strokeWidth="1.6" strokeLinecap="round" />
  </Glyph>
);

export const Auto = () => (
  <Glyph>
    <circle r="8" strokeWidth="1.6" strokeDasharray="38 12.3" transform="rotate(89)" />
    <circle r="3.2" strokeWidth="2" />
    <circle cx="9.6" cy="6" r="6" fill="currentColor" stroke="#1f1f1f" strokeWidth="1" />
    <text
      y="8.95"
      x="9.6"
      textAnchor="middle"
      fontSize="8.4"
      fontWeight="800"
      fontFamily='".SF Compact Rounded", ui-rounded, sans-serif'
      fill="#1f1f1f"
      stroke="none"
    >
      A
    </text>
  </Glyph>
);
