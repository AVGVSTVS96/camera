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

export const BoltAuto = () => (
  <Icon>
    <path d={bolt} fill="currentColor" stroke="none" transform="translate(-2 0) scale(.92)" />
    <circle cx="17.5" cy="17.5" r="5" fill="currentColor" stroke="none" />
    <path d="m15.6 19.8 1.9-5 1.9 5m-3.2-1.6h2.6" stroke="#000" strokeWidth={1.2} />
  </Icon>
);

export const LiveOff = () => (
  <Icon>
    <circle cx="12" cy="12" r="9.5" strokeDasharray="0.1 2.2" strokeWidth={1.8} />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M3.5 3.5 20.5 20.5" />
  </Icon>
);

export const Moon = () => (
  <Icon>
    <path
      d="M15.5 17.6A8 8 0 0 1 9.2 4.4a8.3 8.3 0 1 0 10.4 10.4 8 8 0 0 1-4.1 2.8Z"
      fill="currentColor"
      stroke="none"
      transform="translate(-2 2)"
    />
    <text x="17.5" y="9" fontSize="8.5" fontWeight="600" fill="currentColor" stroke="none" textAnchor="middle">
      2
    </text>
  </Icon>
);

export const DepthOff = () => (
  <Icon>
    <path d="M15.5 4.5c-2.6-.6-3.9.6-4.5 3.4l-2.3 10c-.5 2.2-1.6 2.9-3.7 2.6M8 10h7" />
  </Icon>
);

export const Tone = () => (
  <Icon>
    <circle cx="12" cy="12" r="5.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="9.2" strokeDasharray="0.1 2.4" strokeWidth={2.2} />
  </Icon>
);
