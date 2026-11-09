import { useRef, type PointerEvent } from "react";
import { back, type Props, type Settings, type Update } from "../../state.ts";
import { Chevron } from "./icons.tsx";
import { CELL, place, shift, styles, type StyleName } from "./styles.ts";
import { Swatch } from "./Swatch.tsx";
import { Textures } from "./Textures.tsx";
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

function Pad({
  pad,
  texture,
  grade,
  update,
}: {
  pad: Settings["pad"];
  texture: boolean;
  grade: string;
  update: Update;
}) {
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
        <Textures selected={grade} update={update} />
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
  const { style, customize, pad, texture, grade } = settings;

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
        <Pad pad={pad} texture={texture} grade={grade} update={update} />
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
