import type { ReactNode } from "react";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="30" height="30" viewBox="-15 -15 30 30" fill="none" stroke="currentColor" aria-hidden>
      <circle r="11.5" strokeWidth="1" strokeDasharray="0.1 2.05" strokeLinecap="round" />
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
    <circle cx="8" cy="8" r="7" fill="currentColor" stroke="#1f1f1f" strokeWidth="2" />
    <text x="8" y="11.6" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f1f1f" stroke="none">
      A
    </text>
  </Glyph>
);
