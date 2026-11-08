import { lightings, type Lighting as Effect, type Settings } from "../../state.ts";
import { Ball, CubeEdges, CubeFace } from "./icons.tsx";
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

export function Lighting({ settings }: { settings: Settings }) {
  const place = layout(settings);

  if (!place) return null;

  const portrait = settings.mode === "portrait";
  const selected = lightings.indexOf(settings.lighting);
  const [ax, ay] = place.along;
  const cube = portrait ? 36.5 : 38.93;

  return (
    <div className="lighting" aria-label="Lighting">
      <div className="lighting-dial" style={{ left: place.x, top: place.y }}>
        <CubeFace size={cube} lit={!portrait} />
        <Ball effect={settings.lighting} size={portrait ? 23.75 : 25.33} />
        <CubeEdges size={cube} />
      </div>
      {portrait &&
        lightings.map((effect, i) => {
          const near = neighbours[Math.abs(i - selected) - 1];

          if (!near) return null;

          const gap = Math.sign(i - selected) * near.gap;

          return (
            <div
              key={effect}
              className="lighting-ring"
              style={{
                left: place.x + ax * gap,
                top: place.y + ay * gap,
                width: near.ring,
                height: near.ring,
                opacity: near.alpha,
              }}
            >
              <Ball effect={effect} size={near.size} />
            </div>
          );
        })}
      {place.badge && (
        <div
          className="lighting-name"
          style={{ left: place.badge.x, top: place.badge.y, rotate: `${place.badge.turn}deg` }}
        >
          {names[settings.lighting]}
        </div>
      )}
    </div>
  );
}
