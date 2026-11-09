import { useProfile } from "../../profile.ts";
import { flipCamera, type Props } from "../../state.ts";
import "./flip.css";
import { FlipGlyph } from "./icons.tsx";

const blurred = (brightness: number, offset: number) => ({
  backdropFilter: `blur(24px) brightness(${brightness})`,
  offset,
});

const veil = [
  { backdropFilter: "none", offset: 0 },
  { backdropFilter: "none", offset: 0.3 },
  blurred(0.7, 0.31),
  blurred(0.7, 0.55),
  blurred(0.5, 0.6),
  blurred(0.5, 0.9),
  { backdropFilter: "none", offset: 1 },
];

export function Flip({ settings, update }: Props) {
  const profile = useProfile();

  return (
    <button
      className="flip"
      aria-label="Camera Chooser"
      onClick={() => {
        document.querySelector(".viewfinder")?.animate(veil, { duration: 530, pseudoElement: "::after" });
        update(flipCamera(profile, settings));
      }}
    >
      <FlipGlyph />
    </button>
  );
}
