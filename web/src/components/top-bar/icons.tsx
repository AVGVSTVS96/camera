import type { ReactNode } from "react";
import { bolt, Icon } from "../../icons.tsx";

const slash = "M4 3.5 20 20.5";

const Cut = ({ off, children }: { off: boolean; children: ReactNode }) => (
  <Icon>
    {off ? (
      <>
        <mask id="cut">
          <rect width="24" height="24" fill="#fff" stroke="none" />
          <path d={slash} stroke="#000" strokeWidth={4.4} />
        </mask>
        <g mask="url(#cut)">{children}</g>
        <path d={slash} strokeWidth={1.8} />
      </>
    ) : (
      children
    )}
  </Icon>
);

export const Bolt = ({ mode }: { mode: "auto" | "on" | "off" }) => (
  <Cut off={mode === "off"}>
    <g transform={mode === "auto" ? "translate(-2 .3)" : undefined}>
      <path
        d={bolt}
        fill="currentColor"
        stroke="none"
        transform={mode === "auto" ? "translate(-2 0) scale(.92)" : "translate(1.2 1) scale(.9)"}
      />
      {mode === "auto" && (
        <>
          <circle cx="17.5" cy="17.5" r="5" fill="currentColor" stroke="none" />
          <path d="m15.6 19.8 1.9-5 1.9 5m-3.2-1.6h2.6" stroke="#000" strokeWidth={1.2} />
        </>
      )}
    </g>
  </Cut>
);

export const Live = ({ off }: { off: boolean }) => (
  <Cut off={off}>
    <circle cx="12" cy="12" r="10" strokeDasharray="0.1 2.05" strokeWidth={1.4} />
    <circle cx="12" cy="12" r="6.6" strokeWidth={2} />
    <circle cx="12" cy="12" r="2.8" strokeWidth={2} />
  </Cut>
);

export const Moon = ({ off }: { off: boolean }) => (
  <Cut off={off}>
    <g transform="translate(2.6 -.3)">
      <mask id="bite">
        <rect width="24" height="24" fill="#fff" stroke="none" />
        <circle cx="14.2" cy="9.6" r="6.2" fill="#000" stroke="none" />
      </mask>
      <circle cx="10.6" cy="13.4" r="7" fill="currentColor" stroke="none" mask="url(#bite)" />
      {!off && (
        <text x="18.4" y="9" fontSize="9" fontWeight="700" fill="currentColor" stroke="none" textAnchor="middle">
          2
        </text>
      )}
    </g>
  </Cut>
);

export const Run = ({ off }: { off: boolean }) => (
  <Cut off={off}>
    <circle cx="16" cy="4.6" r="2.1" fill="currentColor" stroke="none" />
    <path
      d="M14.4 8.6 11.2 13.6M11.8 9.6 8.4 11.2M14.2 9.6l3.4 1.6M11.2 13.6l-3.8 4M11.2 13.6l3.6 3.2-1.6 4.4M2.6 8.6h4M1.6 12.2h3.4M3.2 15.6h2.6"
      strokeWidth={2}
    />
  </Cut>
);

export const Plus = () => (
  <Icon size={20}>
    <path d="M12 5v14M5 12h14" strokeWidth={1.8} />
  </Icon>
);
