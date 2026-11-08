import { Icon } from "../../icons.tsx";

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
