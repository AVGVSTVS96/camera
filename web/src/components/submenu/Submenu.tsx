import type { ReactNode } from "react";
import { crossfade } from "../../crossfade.ts";
import "./submenu.css";

function Chevron() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.7 1.75 1.7 8l6 6.25" />
    </svg>
  );
}

const WIDTH = 450;
const HEIGHT = 184;
const RADIUS = 52;

const corner: [number, number][] = [
  [1.52866483, 0],
  [1.08849296, 0],
  [0.86840694, 0],
  [0.63149379, 0.07491461],
  [0.37282383, 0.16905956],
  [0.16905956, 0.37282383],
  [0.07491461, 0.63149379],
  [0, 0.86840694],
  [0, 1.08849296],
  [0, 1.52866483],
];

const place = (right: boolean, bottom: boolean, reverse: boolean) =>
  (reverse ? corner.toReversed() : corner).map(([a, b]) => [
    right ? WIDTH - a * RADIUS : a * RADIUS,
    bottom ? HEIGHT - b * RADIUS : b * RADIUS,
  ]);

const curves = (p: number[][]) => [1, 4, 7].map((j) => `C${p[j]} ${p[j + 1]} ${p[j + 2]}`).join("");

const squircle = () => {
  const sides = [
    place(false, false, true),
    place(true, false, false),
    place(true, true, true),
    place(false, true, false),
  ];

  return `M${sides[0][0]}${sides.map((p, i) => `${i ? `L${p[0]}` : ""}${curves(p)}`).join("")}Z`;
};

const PANEL = squircle();

const RIM = [
  [3.34, 0.04],
  [2.66, 0.05],
  [2, 0.16],
  [1.34, 0.14],
  [0.66, 0.17],
];

export function Submenu({
  title,
  className,
  back,
  auto,
  children,
}: {
  title: string;
  className: string;
  back: () => void;
  auto?: { on: boolean; select: () => void };
  children: ReactNode;
}) {
  return (
    <section className={`submenu ${className}`} style={{ clipPath: `path("${PANEL}")` }}>
      <svg className="submenu-rim" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden>
        {RIM.map(([width, opacity]) => (
          <path key={width} d={PANEL} fill="none" stroke="#fff" strokeWidth={width} opacity={opacity} />
        ))}
      </svg>
      <button
        className="submenu-button submenu-back"
        aria-label="Back"
        onClick={() => crossfade(back, { delay: 166, duration: 553, easing: "cubic-bezier(0, 0, 0.58, 1)" })}
      >
        <Chevron />
      </button>
      <h2 className="submenu-title">{title.toUpperCase()}</h2>
      {auto && (
        <button
          className="submenu-button submenu-auto"
          data-on={auto.on || undefined}
          aria-label="Auto"
          onClick={auto.select}
        >
          A
        </button>
      )}
      {children}
    </section>
  );
}
