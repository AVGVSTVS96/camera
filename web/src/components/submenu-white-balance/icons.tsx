import type { ReactNode } from "react";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 22 22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const Awb = () => <b className="wb-awb">AWB</b>;

export const Bulb = () => (
  <Glyph>
    <path d="M8 14.5c0-1.3-1.5-2.200-1.500-4.200a4.500 4.500 0 0 1 9 0c0 2-1.500 2.900-1.500 4.200ZM8.500 17h5M9.500 19h3" />
    <path d="M11 1.500v1.500M3.500 4.500l1.100 1.100M18.500 4.500l-1.100 1.100M1.500 10h1.500M19 10h1.500" />
  </Glyph>
);

export const Tube = () => (
  <Glyph>
    <rect x="4" y="8" width="14" height="6" rx="3" />
    <path d="M7 11h8M11 2v2.500M5 4l1.200 1.600M17 4l-1.200 1.600M11 17.500V20M5 19l1.200-1.600M17 19l-1.200-1.600" />
  </Glyph>
);

export const Sun = () => (
  <Glyph>
    <circle cx="11" cy="11" r="3.300" />
    <path d="M11 2.500v2.200M11 17.300v2.200M2.500 11h2.200M17.300 11h2.200M5 5l1.500 1.500M15.500 15.500 17 17M17 5l-1.500 1.500M6.500 15.500 5 17" />
  </Glyph>
);

export const Cloud = () => (
  <Glyph>
    <path d="M6.500 16.500a3.500 3.500 0 0 1-.4-7 5 5 0 0 1 9.600-.8 4 4 0 0 1-.7 7.800Z" />
  </Glyph>
);

export const Shade = () => (
  <Glyph>
    <path d="M3 10.500 9 5l6 5.500M5 9.500V17h8V9.500M9 17v-3h2.500v3M16 12.500c1.300 1 2 2.500 2 4.500M14.500 14.500c.8.600 1.200 1.500 1.200 2.500" />
  </Glyph>
);
