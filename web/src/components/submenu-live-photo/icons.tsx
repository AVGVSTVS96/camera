import type { ReactNode } from "react";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="30" height="30" viewBox="-15 -15 30 30" fill="none" stroke="currentColor" aria-hidden>
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
    <circle cx="9.5" cy="6.5" r="5.5" fill="currentColor" stroke="#1f1f1f" strokeWidth="1" />
    <text y="10.4" x="9.5" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#1f1f1f" stroke="none">
      A
    </text>
  </Glyph>
);
