import { useRef, type PointerEvent } from "react";
import { back, type Props, type Settings, type Update } from "../../state.ts";
import { Chevron } from "./icons.tsx";
import { CELL, place, shift, styles, type StyleName } from "./styles.ts";
import { Swatch } from "./Swatch.tsx";
import "./submenu-styles.css";

const at = (e: PointerEvent<HTMLElement>) => e.nativeEvent.offsetX;

const clamp = (value: number) => Math.min(100, Math.max(-100, Math.round(value)));

function Scrubber({ selected, update }: { selected: StyleName; update: Update }) {
  const drag = useRef<{ x: number; from: StyleName }>(undefined);

  return (
    <div
      className="styles-scrubber"
      role="slider"
      tabIndex={0}
      aria-label="Photographic Styles"
      aria-valuetext={selected.toUpperCase()}
      aria-valuemin={0}
      aria-valuemax={styles.length - 1}
      aria-valuenow={styles.indexOf(selected)}
      onKeyDown={(e) => {
        const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];

        if (!by) return;

        e.preventDefault();
        update({ style: shift(selected, by) });
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        drag.current = { x: at(e), from: selected };
      }}
      onPointerMove={(e) => {
        if (drag.current) update({ style: shift(drag.current.from, Math.round((drag.current.x - at(e)) / CELL)) });
      }}
      onPointerUp={() => (drag.current = undefined)}
      onPointerCancel={() => (drag.current = undefined)}
    >
      {place(selected).map(({ entry, x }, i) =>
        entry.divider ? (
          <span key={i} className="styles-divider" style={{ left: x }} />
        ) : (
          <span key={entry.name} className="styles-cell" style={{ left: x }}>
            <Swatch colors={entry.colors} />
          </span>
        ),
      )}
      <span className="styles-dot" />
    </div>
  );
}

const textures = [
  { name: "Standard", glyph: <path d="M9 9l16 16M17 6a11 11 0 1 0 11 11" /> },
  {
    name: "Soft Skin",
    glyph: (
      <path
        d="M17 7a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9ZM8.5 27c0-5 4-7.5 8.5-7.5s8.5 2.500 8.500 7.500Z"
        fill="currentColor"
      />
    ),
  },
  {
    name: "Glow",
    glyph: (
      <path
        d="M17 6v0M24.800 9.200v0M28 17v0M24.800 24.800v0M17 28v0M9.200 24.800v0M6 17v0M9.200 9.200v0"
        strokeWidth="3.200"
      />
    ),
  },
  { name: "Film", glyph: <path d="M7 8h20v18H7ZM12 8v18M22 8v18M7 14h5M22 14h5M7 20h5M22 20h5" /> },
  {
    name: "Grain",
    glyph: (
      <path
        d="M8 8v0M13 8v0M18 8v0M23 8v0M28 8v0M8 13v0M13 13v0M18 13v0M23 13v0M28 13v0M8 18v0M13 18v0M18 18v0M23 18v0M28 18v0M8 23v0M13 23v0M18 23v0M23 23v0M28 23v0"
        strokeWidth="2.400"
      />
    ),
  },
] as const;

function Textures() {
  return (
    <>
      {textures.map(({ name, glyph }, i) => (
        <button key={name} className="styles-texture" data-on={i === 0 || undefined} data-slot={i} aria-label={name}>
          <svg
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.800"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {glyph}
          </svg>
          <span>{name.toUpperCase()}</span>
        </button>
      ))}
      <i className="styles-texture-rule" />
      <p className="styles-texture-note">Texture is applied after taking a photo.</p>
    </>
  );
}

function Pad({ pad, texture, update }: { pad: Settings["pad"]; texture: boolean; update: Update }) {
  const { tone, color } = pad;

  const aim = (e: PointerEvent<HTMLElement>) =>
    update({ pad: { color: clamp(e.nativeEvent.offsetX * 2 - 100), tone: clamp(100 - e.nativeEvent.offsetY * 2) } });

  return (
    <>
      <div className="styles-tabs">
        <button data-on={!texture || undefined} onClick={() => update({ texture: false })}>
          PALETTE
        </button>
        <button data-on={texture || undefined} onClick={() => update({ texture: true })}>
          TEXTURE
        </button>
      </div>
      {texture ? (
        <Textures />
      ) : (
        <div
          className="styles-pad"
          role="slider"
          tabIndex={0}
          aria-label="Style Pad"
          aria-valuetext={`Tone ${tone}, Color ${color}`}
          onKeyDown={(e) => {
            const step = { ArrowUp: [0, 10], ArrowDown: [0, -10], ArrowRight: [10, 0], ArrowLeft: [-10, 0] }[e.key];

            if (!step) return;

            e.preventDefault();
            update({ pad: { color: clamp(color + step[0]!), tone: clamp(tone + step[1]!) } });
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            aim(e);
          }}
          onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && aim(e)}
        >
          <span style={{ left: 44 + color * 0.44, top: 44 - tone * 0.44 }} />
        </div>
      )}
    </>
  );
}

export function SubmenuStyles({ settings, update }: Props) {
  const { style, customize, pad, texture } = settings;

  return (
    <section className="styles" aria-label="Photographic Styles">
      <div className="styles-header">{!customize && style.toUpperCase()}</div>
      <button
        className="styles-back"
        aria-label="Back"
        onClick={() => update({ ...back, customize: false, texture: false })}
      >
        <Chevron />
      </button>
      {customize ? (
        <Pad pad={pad} texture={texture} update={update} />
      ) : (
        <>
          <Scrubber selected={style} update={update} />
          <button className="styles-customize" onClick={() => update({ customize: true })}>
            CUSTOMIZE
          </button>
        </>
      )}
    </section>
  );
}
