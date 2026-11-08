import type { ReactNode } from "react";

function Icon({ size = 24, children }: { size?: number; children: ReactNode }) {
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

const bolt = "M13.5 2 5.5 13.2h5.6L9.8 22l8-11.6h-5.7L13.5 2Z";

export const BoltAuto = () => (
  <Icon>
    <path d={bolt} fill="currentColor" stroke="none" transform="translate(-2 0) scale(.92)" />
    <circle cx="17.5" cy="17.5" r="5" fill="currentColor" stroke="none" />
    <path d="m15.6 19.8 1.9-5 1.9 5m-3.2-1.6h2.6" stroke="#000" strokeWidth={1.2} />
  </Icon>
);

export const BoltSlash = () => (
  <Icon>
    <path d={bolt} fill="currentColor" stroke="none" transform="translate(1.2 1) scale(.9)" />
    <path d="M4 3.5 20 20.5" stroke="#000" strokeWidth={3.4} />
    <path d="M4 3.5 20 20.5" />
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

export const RunSlash = () => (
  <Icon>
    <circle cx="14.5" cy="4.2" r="1.8" fill="currentColor" stroke="none" />
    <path d="m6.5 10 3.5-3h4l2 4 3 1M10 7l-1.5 6 4 3-1 5M8.5 13l-2 3.5H3" strokeWidth={1.9} />
    <path d="M3.5 3.5 20.5 20.5" stroke="#000" strokeWidth={3.4} />
    <path d="M3.5 3.5 20.5 20.5" />
  </Icon>
);

export const DepthOff = () => (
  <Icon>
    <path d="M15.5 4.5c-2.6-.6-3.9.6-4.5 3.4l-2.3 10c-.5 2.2-1.6 2.9-3.7 2.6M8 10h7" />
    <path d="M5 5.5 19 19.5" />
  </Icon>
);

export const Tone = () => (
  <Icon>
    <circle cx="12" cy="12" r="5.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="9.2" strokeDasharray="0.1 2.4" strokeWidth={2.2} />
  </Icon>
);

export const More = () => (
  <svg className="glyph" width="20" height="13" viewBox="0 0 20 13" fill="currentColor" aria-hidden>
    {[2.75, 10, 17.25].flatMap((x) => [2.75, 10.25].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.75" />))}
  </svg>
);

export const Flip = () => (
  <Icon size={26}>
    <path d="M5.2 10.2A7 7 0 0 1 18 7.6" strokeWidth={1.9} />
    <path d="m18.8 4.2-.6 3.9-3.8-.9" strokeWidth={1.9} />
    <path d="M18.8 13.8A7 7 0 0 1 6 16.4" strokeWidth={1.9} />
    <path d="m5.2 19.8.6-3.9 3.8.9" strokeWidth={1.9} />
  </Icon>
);

export const Macro = () => (
  <Icon>
    <path d="M12 21V13M12 13c-4 0-5.5-3-5.5-7l3 1.8L12 4l2.5 3.8 3-1.8c0 4-1.5 7-5.5 7Z" fill="currentColor" />
    <path d="M12 17.5c-1.5-2-4-2.5-6-2 .5 2.5 3 4 6 3.5 3 .5 5.5-1 6-3.5-2-.5-4.5 0-6 2Z" fill="currentColor" />
  </Icon>
);

export const Plus = () => (
  <Icon size={20}>
    <path d="M12 5v14M5 12h14" strokeWidth={1.8} />
  </Icon>
);

export const Aspect = () => (
  <Icon size={28}>
    <path d="M3 8V4.5A1.5 1.5 0 0 1 4.5 3H8m8 0h3.5A1.5 1.5 0 0 1 21 4.5V8m0 8v3.5a1.5 1.5 0 0 1-1.5 1.5H16m-8 0H4.5A1.5 1.5 0 0 1 3 19.5V16" />
    <text x="12" y="14.6" fontSize="7.5" fontWeight="500" fill="currentColor" stroke="none" textAnchor="middle">
      4:3
    </text>
  </Icon>
);

export const TimerOff = () => (
  <Icon size={28}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5V7M4.5 4.5l15 15" />
  </Icon>
);

export const Exposure = () => (
  <Icon size={28}>
    <path d="M12 4v9M7.5 8.5h9M7 19h10" />
  </Icon>
);

export const Styles = () => (
  <svg className="glyph" width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {[4, 8, 12, 16, 20].flatMap((x) =>
      [4, 8, 12, 16, 20].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={x === 12 && y === 12 ? 1.5 : 0.9} />),
    )}
  </svg>
);

export const Framing = () => (
  <Icon size={28}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
  </Icon>
);

export const Scene = () => (
  <Icon size={28}>
    <path d="M7 18h10a3.5 3.5 0 0 0 .4-7A5 5 0 0 0 8 10.5 3.8 3.8 0 0 0 7 18Z" />
    <path d="M17 3v2m4.5 2-1.5 1M12.5 6.5 11 5" />
  </Icon>
);
