import { bolt, Icon } from "../../icons.tsx";
import type { Flash } from "../../state.ts";

const slash = (d = "M4 3.5 20 20.5") => (
  <>
    <path d={d} stroke="#000" strokeWidth={3.4} />
    <path d={d} />
  </>
);

export const Aspect = () => (
  <Icon size={30}>
    <path d="M3 8V4.5A1.5 1.5 0 0 1 4.5 3H8m8 0h3.5A1.5 1.5 0 0 1 21 4.5V8m0 8v3.5a1.5 1.5 0 0 1-1.5 1.5H16m-8 0H4.5A1.5 1.5 0 0 1 3 19.5V16" />
    <text x="12" y="14.6" fontSize="7.5" fontWeight="500" fill="currentColor" stroke="none" textAnchor="middle">
      4:3
    </text>
  </Icon>
);

export const TimerOff = () => (
  <Icon size={30}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5V7M4.5 4.5l15 15" />
  </Icon>
);

export const Exposure = () => (
  <Icon size={30}>
    <path d="M12 4v9M7.5 8.5h9M7 19h10" />
  </Icon>
);

export const Styles = () => (
  <svg className="glyph" width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    {[4, 8, 12, 16, 20].flatMap((x) =>
      [4, 8, 12, 16, 20].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r={x === 12 && y === 12 ? 1.5 : 0.9} />),
    )}
  </svg>
);

export const Framing = () => (
  <Icon size={30}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
    <circle cx="12" cy="15" r="1.5" fill="currentColor" />
  </Icon>
);

export const Focus = () => (
  <Icon size={30}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
  </Icon>
);

export const WhiteBalance = () => (
  <Icon size={30}>
    <path d="M6.5 19h8a3.2 3.2 0 0 0 .4-6.4A4.6 4.6 0 0 0 6 13.2 3 3 0 0 0 6.5 19Z" />
    <path d="M11.4 9.2A4.4 4.4 0 0 1 18.6 12M15.5 3v1.7m4.6.3-1.2 1.2m3 3.3h-1.7M11 5l1.2 1.2" />
  </Icon>
);

export const SmartTake = () => (
  <Icon size={30}>
    <circle cx="12" cy="12" r="5.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="9.2" strokeDasharray="0.1 2.4" strokeWidth={2} />
  </Icon>
);

export const Depth = () => (
  <Icon size={30}>
    <path d="M15.5 4.5c-2.6-.6-3.9.6-4.5 3.4l-2.3 10c-.5 2.2-1.6 2.9-3.7 2.6M8 10h7" />
  </Icon>
);

export const Bolt = ({ flash }: { flash: Flash }) =>
  flash === "auto" ? (
    <Icon size={30}>
      <path d={bolt} fill="currentColor" stroke="none" transform="translate(-2 0) scale(.92)" />
      <circle cx="17.5" cy="17.5" r="5" fill="currentColor" stroke="none" />
      <path d="m15.6 19.8 1.9-5 1.9 5m-3.2-1.6h2.6" stroke="#000" strokeWidth={1.2} />
    </Icon>
  ) : (
    <Icon size={30}>
      <path d={bolt} fill="currentColor" stroke="none" transform="translate(1.2 1) scale(.9)" />
      {flash === "off" && slash()}
    </Icon>
  );

export const Action = ({ on }: { on: boolean }) => (
  <Icon size={30}>
    <circle cx="14.5" cy="4.2" r="1.8" fill="currentColor" stroke="none" />
    <path d="m6.5 10 3.5-3h4l2 4 3 1M10 7l-1.5 6 4 3-1 5M8.5 13l-2 3.5H3" strokeWidth={1.9} />
    {!on && slash("M3.5 3.5 20.5 20.5")}
  </Icon>
);

export const Adaptive = () => (
  <Icon size={30}>
    <circle cx="11" cy="12" r="7" strokeDasharray="0.7 1.3" strokeWidth={4} />
    <circle cx="18" cy="17.5" r="4.6" fill="currentColor" stroke="none" />
    <path d="m16.1 19.7 1.9-4.7 1.9 4.7m-3.1-1.5h2.4" stroke="#000" strokeWidth={1.2} />
  </Icon>
);

export const Constant = () => (
  <Icon size={30}>
    <circle cx="12" cy="12" r="8" strokeDasharray="0.7 1.3" strokeWidth={4} />
  </Icon>
);

export const NightMode = () => (
  <Icon size={30}>
    <path
      d="M15.5 17.6A8 8 0 0 1 9.2 4.4a8.3 8.3 0 1 0 10.4 10.4 8 8 0 0 1-4.1 2.8Z"
      fill="currentColor"
      stroke="none"
      transform="translate(-2 2)"
    />
    <text x="17.5" y="9" fontSize="9" fontWeight="500" fill="currentColor" stroke="none" textAnchor="middle">
      A
    </text>
  </Icon>
);

export const LivePhoto = () => (
  <Icon size={30}>
    <circle cx="11" cy="11" r="9" strokeDasharray="0.1 2.2" strokeWidth={1.8} />
    <circle cx="11" cy="11" r="5.5" />
    <circle cx="11" cy="11" r="2.4" />
    <circle cx="18" cy="18" r="4.6" fill="currentColor" stroke="none" />
    <path d="m16.1 20.2 1.9-4.7 1.9 4.7m-3.1-1.5h2.4" stroke="#000" strokeWidth={1.2} />
  </Icon>
);

export const DepthOff = () => (
  <Icon size={30}>
    <path d="M15.5 4.5c-2.6-.6-3.9.6-4.5 3.4l-2.3 10c-.5 2.2-1.6 2.9-3.7 2.6M8 10h7" />
    {slash("M5 5.5 19 19.5")}
  </Icon>
);
