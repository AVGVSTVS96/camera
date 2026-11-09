import type { ReactNode } from "react";
import type { Update } from "../../state.ts";

const grain = Array.from({ length: 81 }, (_, i) => [(i % 9) - 4, Math.floor(i / 9) - 4] as const).filter(
  ([x, y]) => Math.hypot(x, y) <= 4.4,
);

const textures: { name: string; x: number; icon: ReactNode }[] = [
  {
    name: "Standard",
    x: 75,
    icon: (
      <g fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round">
        <circle r="10" />
        <path d="M-9.8-9.8 9.8 9.8" />
      </g>
    ),
  },
  {
    name: "Soft Skin",
    x: 145.3,
    icon: (
      <g fill="#fff">
        <circle cy="-5.2" r="4.4" />
        <path d="M-9 9.8v-.8c0-4 4-6.6 9-6.6s9 2.6 9 6.6v.8z" />
      </g>
    ),
  },
  {
    name: "Glow",
    x: 211.3,
    icon: (
      <g fill="#fff">
        {Array.from({ length: 8 }, (_, i) => (
          <circle
            key={i}
            cx={9 * Math.sin((i * Math.PI) / 4)}
            cy={-9 * Math.cos((i * Math.PI) / 4)}
            r={i % 4 ? 1.7 : 1.4}
          />
        ))}
      </g>
    ),
  },
  {
    name: "Film",
    x: 277.3,
    icon: (
      <g fill="#fff">
        <path
          fillRule="evenodd"
          d="M-10.4-9.7h20.8a2 2 0 0 1 2 2v15.4a2 2 0 0 1-2 2h-20.8a2 2 0 0 1-2-2v-15.4a2 2 0 0 1 2-2zm1.5 1.5a1 1 0 0 0-1 1v14.4a1 1 0 0 0 1 1h17.8a1 1 0 0 0 1-1v-14.4a1 1 0 0 0-1-1z"
        />
        <path d="M-12.4-6.3h3.6v2.4h-3.6zm0 4.7h3.6v2.4h-3.6zm0 4.7h3.6v2.4h-3.6zm21.2-9.4h3.6v2.4h-3.6zm0 4.7h3.6v2.4h-3.6zm0 4.7h3.6v2.4h-3.6zM-7.4-9h1.4v18h-1.4zm13.4 0h1.4v18h-1.4zM-7-.7h14v1.4h-14z" />
      </g>
    ),
  },
  {
    name: "Grain",
    x: 379.3,
    icon: (
      <g fill="#fff">
        {grain.map(([x, y]) => (
          <circle key={`${x},${y}`} cx={x * 2.6} cy={y * 2.6} r="0.95" />
        ))}
      </g>
    ),
  },
];

export function Textures({ selected, update }: { selected: string; update: Update }) {
  return (
    <>
      {textures.map(({ name, x, icon }) => {
        const id = name.toLowerCase();

        return (
          <button
            key={id}
            className="styles-texture"
            data-on={selected === id || undefined}
            style={{ left: x - 29.3 }}
            aria-label={name.toUpperCase()}
            onClick={() => update({ grade: id })}
          >
            <svg width="50" height="50" viewBox="-25 -25 50 50">
              {icon}
            </svg>
            <span>{name.toUpperCase()}</span>
          </button>
        );
      })}
      <span className="styles-rule" />
      <p className="styles-note">Texture is applied after taking a photo.</p>
    </>
  );
}
