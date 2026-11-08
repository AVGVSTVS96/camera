import { lightings, type Lighting as Effect, type Settings } from "../../state.ts";
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

export function Lighting({ settings }: { settings: Settings }) {
  const place = layout(settings);

  if (!place) return null;

  const portrait = settings.mode === "portrait";
  const selected = lightings.indexOf(settings.lighting);
  const [ax, ay] = place.along;
  const core = portrait ? 23.75 : 25.33;
  const turn = settings.orientation === "landscape" ? -90 : 0;

  return (
    <div className="lighting" aria-label="Lighting">
      <div className="lighting-dial" style={{ left: place.x, top: place.y }}>
        <CubeFaces turn={turn} lit={settings.lighting !== "natural"} />
        <span className="lighting-core" style={{ rotate: `${turn}deg` }}>
          <Ball effect={settings.lighting} size={core} ring={core * 0.9} />
        </span>
        <CubeLines turn={turn} />
      </div>
      {portrait &&
        lightings.map((effect, i) => {
          const near = neighbours[Math.abs(i - selected) - 1];

          if (!near) return null;

          const gap = Math.sign(i - selected) * near.gap;

          return (
            <div
              key={effect}
              className={effect === "natural" ? "lighting-ring lighting-ring-dotted" : "lighting-ring"}
              style={{
                left: place.x + ax * gap,
                top: place.y + ay * gap,
                width: near.ring,
                height: near.ring,
                opacity: near.alpha,
              }}
            >
              <Ball effect={effect} size={near.size} ring={near.ring} />
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
