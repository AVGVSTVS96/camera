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
  <svg width="15" height="17" viewBox="0 0 15 17" fill="none" stroke="currentColor" aria-hidden>
    <path
      d="M6 12.4 5.6 10.7C5 9 4.3 8 4.3 6.9a3.200 3.200 0 0 1 6.400 0c0 1.100-.7 2.100-1.300 3.800L9 12.400Z"
      strokeWidth=".7"
      strokeLinejoin="round"
    />
    <path
      d="M5.500 13h4M5.400 14.100h4.200M7.500 1.100v1.500M2.800 2.800l1.500 1.400M12.200 2.800l-1.500 1.400M1.200 7.200H3M12 7.200h1.800"
      strokeWidth=".9"
    />
    <path d="M6 14.700h3q-.5.900-1.500.900t-1.500-.9Z" fill="currentColor" stroke="none" />
  </svg>
);

export const Tube = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" aria-hidden>
    <rect x="1" y="4" width="11" height="3.900" rx=".8" fill="currentColor" stroke="none" />
    <path d="M1.900 5h1.600v1.900H1.900ZM9.500 5h1.600v1.900H9.500Z" fill="#202020" stroke="none" />
    <path
      d="M6.500.6v1.900M2.500 1.500l1.700 1.400M10.500 1.500 8.800 2.900M6.500 9.600v1.900M2.500 10.600l1.700-1.400M10.500 10.600 8.800 9.200"
      strokeWidth=".9"
    />
  </svg>
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
