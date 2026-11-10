import { bolt, Icon } from "../../icons.tsx";
import type { Flash } from "../../state.ts";

const slash = (d = "M4 3.5 20 20.5") => <path d={d} />;

export const Aspect = () => (
  <Icon size={34}>
    <path d="M3 7.8V6a3 3 0 0 1 3-3h1.8M16.2 3H18a3 3 0 0 1 3 3v1.8M21 16.2V18a3 3 0 0 1-3 3h-1.8M7.8 21H6a3 3 0 0 1-3-3v-1.8" />
    <text x="12" y="15.4" fontSize="10.5" fontWeight="300" fill="currentColor" stroke="none" textAnchor="middle">
      4:3
    </text>
  </Icon>
);

export const TimerOff = () => (
  <Icon size={34}>
    <path
      d="M12 2.8V5.4M12 2.8A9.2 9.2 0 0 1 19.6 17.2M17.5 19.4A9.2 9.2 0 0 1 4.5 6.7M3 3 21.5 21.3"
      strokeWidth={1.1}
    />
  </Icon>
);

export const Exposure = () => (
  <Icon size={34}>
    <path d="M12 4.6v10.8M6.1 10h11.8M6.1 19.3h11.8" strokeWidth={1.1} />
  </Icon>
);

const corner = (n: number) => n === 4 || n === 20;

const dots = [4, 8, 12, 16, 20].flatMap((x) =>
  [4, 8, 12, 16, 20].flatMap((y) => (corner(x) && corner(y) ? [] : [{ x, y, hub: x === 12 && y === 12 }])),
);

export const Styles = () => (
  <Icon size={34}>
    {dots.map(({ x, y, hub }) =>
      hub ? (
        <circle key="hub" cx={x} cy={y} r={1.5} strokeWidth={0.75} />
      ) : (
        <circle
          key={`${x}${y}`}
          cx={x}
          cy={y}
          r={x === 12 || y === 12 ? 0.8 : 0.55}
          fill="currentColor"
          stroke="none"
        />
      ),
    )}
  </Icon>
);

export const Framing = ({ on = false }: { on?: boolean }) => (
  <Icon size={34}>
    <g color={on ? "#ffe300" : undefined}>
      <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
      <circle cx="12" cy="9.6" r="2" fill="currentColor" stroke="none" />
      <path d="M7.6 17a4.4 4.4 0 0 1 8.8 0Z" fill="currentColor" stroke="none" />
    </g>
  </Icon>
);

export const Focus = () => (
  <Icon size={34}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
    <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none" />
  </Icon>
);

export const WhiteBalance = () => (
  <Icon size={34}>
    <mask id="wb-cut">
      <rect width="24" height="24" fill="#fff" stroke="none" />
      <path d="M5.2 22h9.2a4.2 4.2 0 0 0 .6-8.3 6 6 0 0 0-11.6 1.4A3.5 3.5 0 0 0 5.2 22Z" fill="#000" stroke="none" />
    </mask>
    <circle cx="16.6" cy="12" r="4.3" mask="url(#wb-cut)" />
    <path d="M11.93 7.33L10.09 5.49M16.60 5.40L16.60 2.80M21.27 7.33L23.11 5.49M23.20 12.00L25.80 12.00M21.27 16.67L23.11 18.51" />
    <path d="M5.2 22h9.2a4.2 4.2 0 0 0 .6-8.3 6 6 0 0 0-11.6 1.4A3.5 3.5 0 0 0 5.2 22Z" />
  </Icon>
);

export const SmartTake = () => (
  <Icon size={34}>
    <circle cx="12" cy="12" r="6.8" fill="currentColor" stroke="none" />
    <path d="M2.5 11A9.6 9.6 0 0 1 21.5 11" strokeWidth={1.1} />
    <circle cx="21.04" cy="14.94" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="19.69" cy="17.58" r="0.55" fill="currentColor" stroke="none" />
    <circle cx="17.58" cy="19.69" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="14.94" cy="21.04" r="0.65" fill="currentColor" stroke="none" />
    <circle cx="12.00" cy="21.50" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="9.06" cy="21.04" r="0.65" fill="currentColor" stroke="none" />
    <circle cx="6.42" cy="19.69" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="4.31" cy="17.58" r="0.55" fill="currentColor" stroke="none" />
    <circle cx="2.96" cy="14.94" r="0.5" fill="currentColor" stroke="none" />
  </Icon>
);

export const Depth = ({ off = false }: { off?: boolean }) => (
  <Icon size={34}>
    <g transform="translate(12 12) scale(.86) translate(-12 -12)" strokeWidth={1.35}>
      <path d="M15.5 4.5c-2.6-.6-3.9.6-4.5 3.4l-2.3 10c-.5 2.2-1.6 2.9-3.7 2.6M8 10h7" />
    </g>
    {off && slash("M5 5.5 19 19.5")}
  </Icon>
);

export const Bolt = ({ flash }: { flash: Flash }) =>
  flash === "auto" ? (
    <Icon size={34}>
      <path d={bolt} fill="currentColor" stroke="none" transform="translate(.55 -1) scale(.92 1)" />
      <circle cx="18.3" cy="17.6" r="4.9" fill="currentColor" stroke="none" />
      <path d="m16.2 19.6 2.1-4.8 2.1 4.8m-3.4-1.5h2.7" stroke="#000" strokeWidth={0.9} />
    </Icon>
  ) : (
    <Icon size={34}>
      <mask id="bolt-cut">
        <rect width="24" height="24" fill="#fff" stroke="none" />
        {flash === "off" && <path d="M3.5 3.5 20.5 20.5" stroke="#000" strokeWidth={3.6} />}
      </mask>
      <path d={bolt} fill="currentColor" stroke="none" transform="translate(.4 .2)" mask="url(#bolt-cut)" />
      {flash === "off" && slash("M3.5 3.5 20.5 20.5")}
    </Icon>
  );

export const Action = ({ on }: { on: boolean }) => (
  <Icon size={34}>
    <circle cx="18.4" cy="3.9" r="2.1" fill="currentColor" stroke="none" />
    <path d="M12.8 7.8 14 14" strokeWidth={3} />
    <path d="M14.6 8.8 20.2 11.4 23 9.6M14.2 14.4 19.8 15.8 16.8 18.8M13.6 14.6 8.8 21.4" strokeWidth={2.3} />
    <path d="M5.2 3.8h6M0 8.6h7.3M3.6 13.5h5.3M0 18.2h6" strokeWidth={1.3} />
    {!on && <path d="M1.6 1.5 22.6 22.4" strokeWidth={1.2} />}
  </Icon>
);

const ticks = (cx: number, cy: number, skip?: { x: number; y: number; r: number }) =>
  Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const [r1, r2] = i % 2 ? [7.8, 10.2] : [7, 10.4];
    const [x1, y1, x2, y2] = [cx + c * r1, cy + s * r1, cx + c * r2, cy + s * r2];

    if (skip && Math.hypot((x1 + x2) / 2 - skip.x, (y1 + y2) / 2 - skip.y) < skip.r) return "";

    return `M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }).join("");

export const Adaptive = () => (
  <Icon size={34}>
    <path d={ticks(11.9, 12.3, { x: 20.2, y: 18.1, r: 6.4 })} strokeWidth={0.9} />
    <circle cx="20.2" cy="18.1" r="4.8" fill="currentColor" stroke="none" />
    <path d="m18.2 20.3 2-4.7 2 4.7m-3.2-1.5h2.5" stroke="#000" strokeWidth={1.2} />
  </Icon>
);

export const Constant = () => (
  <Icon size={34}>
    <path d={ticks(12, 12)} strokeWidth={0.9} />
  </Icon>
);

export const NightMode = ({ off = false, exposure }: { off?: boolean; exposure?: string }) =>
  off ? (
    <Icon size={34}>
      <mask id="night-off">
        <rect width="24" height="24" fill="#fff" />
        <path d="M2.6 3.8 19.4 20.6" stroke="#000" strokeWidth={2.6} />
      </mask>
      <path d="M9.45 3.17A9 9 0 1 0 20.72 14.03 8.4 8.4 0 0 1 9.45 3.17Z" strokeWidth={0.8} mask="url(#night-off)" />
      {[
        [12.7, 2.3],
        [16.8, 3.5],
        [12.5, 6.1],
        [16.4, 6.8],
        [19.7, 6.4],
        [13.9, 9.4],
        [17.1, 10.8],
        [20.9, 10.5],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={0.65} fill="currentColor" stroke="none" />
      ))}
      <path d="M2.6 3.8 19.4 20.6" strokeWidth={0.8} />
    </Icon>
  ) : (
    <Icon size={34}>
      <mask id="crescent">
        <circle cx="11.6" cy="12" r="9.8" fill="#fff" />
        <circle cx="15.2" cy="8.4" r="8.2" fill="#000" />
      </mask>
      <circle cx="11.6" cy="12" r="9.8" fill="currentColor" stroke="none" mask="url(#crescent)" />
      <text x="16.6" y="10.8" fontSize="13.5" fontWeight="300" fill="currentColor" stroke="none" textAnchor="middle">
        {exposure ?? "A"}
      </text>
    </Icon>
  );

export const LivePhoto = ({ off = false }: { off?: boolean }) => (
  <Icon size={34}>
    <mask id="live-cut">
      <rect width="24" height="24" fill="#fff" stroke="none" />
      {off ? (
        <path d="M3.5 3.5 20.5 20.5" stroke="#000" strokeWidth={3.4} />
      ) : (
        <circle cx="20.1" cy="17.1" r="6.4" fill="#000" stroke="none" />
      )}
    </mask>
    <g mask="url(#live-cut)">
      <circle cx="11.8" cy="11.3" r="10.3" strokeDasharray="0.1 1.75" strokeWidth={0.9} />
      <circle cx="11.8" cy="11.3" r="7.3" strokeWidth={1} />
      <circle cx="11.8" cy="11.3" r="3.2" strokeWidth={1.2} />
    </g>
    {off ? (
      slash("M3.5 3.5 20.5 20.5")
    ) : (
      <>
        <circle cx="20.1" cy="17.1" r="4.6" fill="currentColor" stroke="none" />
        <path d="m18.1 19.1 2-4.6 2 4.6m-3.3-1.4h2.6" stroke="#000" strokeWidth={0.9} />
      </>
    )}
  </Icon>
);
