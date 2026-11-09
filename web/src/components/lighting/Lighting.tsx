import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { lightings, type Lighting as Effect, type Props } from "../../state.ts";
import { Ball, CubeFaces, CubeLines } from "./icons.tsx";
import { layout, neighbours } from "./layout.ts";
import "./lighting.css";

const names: Record<Effect, string> = {
  natural: "NATURAL LIGHT",
  studio: "STUDIO LIGHT",
  contour: "CONTOUR LIGHT",
  stage: "STAGE LIGHT",
  "stage-mono": "STAGE LIGHT MONO",
  "high-key-mono": "HIGH-KEY LIGHT MONO",
};

const pickedFade = [0.625, 0.25];

export function Lighting({ settings, update }: Props) {
  const drag = useRef<{ from: number; at: number }>(undefined);
  const place = layout(settings);

  if (!place) return null;

  const portrait = settings.mode === "portrait";
  const selected = lightings.indexOf(settings.lighting);
  const [ax, ay] = place.along;
  const core = portrait ? 23.75 : 25.33;
  const scale = (portrait ? 36.5 : 38.93) / 38.93;
  const turn = settings.orientation === "landscape" ? 90 : settings.display === "inner" ? 180 : 0;

  function pick(index: number) {
    const lighting = lightings[Math.min(Math.max(index, 0), lightings.length - 1)];

    if (lighting !== settings.lighting) update({ lighting, picked: true });
  }

  function key(e: KeyboardEvent) {
    const by = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[e.key];

    if (!by) return;

    e.preventDefault();
    pick(selected + by);
  }

  const along = (e: PointerEvent) => e.clientX * ax + e.clientY * ay;

  function move(e: PointerEvent) {
    if (!drag.current) return;

    const moved = (along(e) - drag.current.from) / neighbours[0].gap;
    const by = -Math.trunc(moved);

    if (!by) return;

    pick(drag.current.at + by);
  }

  return (
    <div className="lighting">
      <div
        className="lighting-dial"
        style={{ left: place.x, top: place.y, opacity: settings.dial && !portrait ? 0.04 : 1 }}
      >
        <CubeFaces turn={turn} scale={scale} effect={settings.lighting} />
        <span className="lighting-core" style={{ rotate: `${turn}deg` }}>
          <Ball effect={settings.lighting} size={core} ring={core * 0.9} />
        </span>
        <CubeLines turn={turn} scale={scale} />
      </div>
      {portrait && (
        <div
          className="lighting-band"
          role="slider"
          aria-label="Lighting"
          aria-valuemin={0}
          aria-valuemax={lightings.length - 1}
          aria-valuenow={selected}
          aria-valuetext={names[settings.lighting]}
          tabIndex={0}
          style={{
            left: place.x,
            top: place.y,
            width: ax ? 2 * (neighbours.at(-1)?.gap ?? 0) : 90,
            height: ax ? 90 : 2 * (neighbours.at(-1)?.gap ?? 0),
          }}
          onKeyDown={key}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { from: along(e), at: selected };
          }}
          onPointerMove={move}
          onPointerUp={() => (drag.current = undefined)}
          onPointerCancel={() => (drag.current = undefined)}
        />
      )}
      {portrait &&
        lightings.map((effect, i) => {
          const near = neighbours[Math.abs(i - selected) - 1];

          if (!near) return null;

          const gap = Math.sign(i - selected) * near.gap;
          const alpha = settings.picked && gap < 0 ? pickedFade[Math.abs(i - selected) - 1] : near.alpha;

          if (alpha === undefined) return null;

          return (
            <div
              key={effect}
              className={effect === "natural" ? "lighting-ring lighting-ring-dotted" : "lighting-ring"}
              style={{
                left: place.x + ax * gap,
                top: place.y + ay * gap,
                width: near.ring,
                height: near.ring,
                opacity: alpha,
              }}
            >
              <Ball effect={effect} size={near.size} ring={near.ring * 0.89} turn={turn} />
            </div>
          );
        })}
      {place.badge && (
        <div className="lighting-name" style={{ left: place.badge.x, top: place.badge.y }}>
          {names[settings.lighting]}
        </div>
      )}
    </div>
  );
}
