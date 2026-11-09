import type { ReactNode } from "react";

export function Icon({ size = 24, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      className="glyph"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const bolt = "M13.5 2 5.5 13.2h5.6L9.8 22l8-11.6h-5.7L13.5 2Z";

export const Tone = () => (
  <Icon>
    <circle cx="12" cy="12" r="5.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="9.2" strokeDasharray="0.1 2.4" strokeWidth={2.2} />
  </Icon>
);
