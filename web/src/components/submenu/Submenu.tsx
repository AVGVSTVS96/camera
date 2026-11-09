import type { ReactNode } from "react";
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
        <defs>
          <linearGradient id="submenu-rim" x1="0" y1="0.3" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <path d={PANEL} fill="none" stroke="url(#submenu-rim)" strokeWidth="10" opacity="0.07" />
        <path d={PANEL} fill="none" stroke="url(#submenu-rim)" strokeWidth="4" opacity="0.15" />
        <path d={PANEL} fill="none" stroke="url(#submenu-rim)" strokeWidth="2" opacity="0.5" />
      </svg>
      <button className="submenu-button submenu-back" aria-label="Back" onClick={back}>
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
