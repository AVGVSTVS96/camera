import { type ReactNode, useId } from "react";
import { bolt, Icon } from "../../icons.tsx";

function Cut({
  off,
  slash,
  width = 4.4,
  children,
}: {
  off: boolean;
  slash: string;
  width?: number;
  children: ReactNode;
}) {
  const id = `top-bar-cut-${useId().replace(/\W/g, "")}`;

  return (
    <Icon>
      {off ? (
        <>
          <mask id={id}>
            <rect width="24" height="24" fill="#fff" stroke="none" />
            <path d={slash} stroke="#000" strokeWidth={width} />
          </mask>
          <g mask={`url(#${id})`}>{children}</g>
          <path d={slash} strokeWidth={1.8} />
        </>
      ) : (
        children
      )}
    </Icon>
  );
}

const wide = "M4 3.5 20 20.5";

export const Bolt = ({ mode }: { mode: "auto" | "on" | "off" }) => (
  <Cut off={mode === "off"} slash="M4.2 5 15.8 19.2" width={4.2}>
    {mode === "off" ? (
      <path
        d={bolt}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.5}
        transform="translate(-.4 .6) scale(.93)"
      />
    ) : mode === "auto" ? (
      <>
        <path
          d={bolt}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth={2.2}
          transform="translate(-.94 .78) scale(.88)"
        />
        <circle cx="15.4" cy="17.4" r="4.7" fill="currentColor" stroke="none" />
        <path d="m13.6 19.5 1.8-4.7 1.8 4.7m-3-1.5h2.4" stroke="#5d5d55" strokeWidth={1.2} />
      </>
    ) : (
      <path d={bolt} fill="currentColor" stroke="none" transform="translate(1.2 1) scale(.9)" />
    )}
  </Cut>
);

export const Live = ({ off }: { off: boolean }) => (
  <Cut off={off} slash={wide}>
    <g transform="translate(-.7 .3)">
      <circle cx="12" cy="12" r="9.3" strokeDasharray="0.1 1.45" strokeWidth={1.1} />
      <circle cx="12" cy="12" r="6.6" strokeWidth={2} />
      <circle cx="12" cy="12" r="2.8" strokeWidth={2} />
    </g>
  </Cut>
);

export const Moon = ({ off }: { off: boolean }) => (
  <Cut off={off} slash={wide}>
    <g transform="translate(2.6 -.3)">
      <mask id="top-bar-bite">
        <rect width="24" height="24" fill="#fff" stroke="none" />
        <circle cx="14.65" cy="8.85" r="6.6" fill="#000" stroke="none" />
      </mask>
      <circle cx="10.8" cy="12.9" r="7.5" fill="currentColor" stroke="none" mask="url(#top-bar-bite)" />
      {!off && (
        <text x="13.8" y="10.4" fontSize="7" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">
          2
        </text>
      )}
    </g>
  </Cut>
);

export const Run = ({ off }: { off: boolean }) => (
  <Cut off={off} slash="M2.8 4.4 18.6 20" width={3.2}>
    <g transform="translate(1 0)">
      <circle cx="17.05" cy="5.35" r="1.85" fill="currentColor" stroke="none" />
      <path d="M16 9.6 14.4 14" strokeWidth={3.4} />
      <path d="M15.8 10.4l4.6.6M15 10.6l-3 1.6M14.4 14.4l-3.4 4.2M14.4 14.4l2.8 2.8-1 3.8" strokeWidth={2} />
      <path d="M2.6 5.1h5.4M2.4 9.1h4.6M2.6 13.1h5.4M3.6 17.1h4" strokeWidth={1.5} />
    </g>
  </Cut>
);

export const Plus = () => (
  <Icon size={18}>
    <path d="M12 5v14M5 12h14" strokeWidth={1.8} />
  </Icon>
);
