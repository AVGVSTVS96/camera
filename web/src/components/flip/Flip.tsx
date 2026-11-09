import { useProfile } from "../../profile.ts";
import { flipCamera, type Props } from "../../state.ts";
import "./flip.css";
import { FlipGlyph } from "./icons.tsx";

const preview = [
  [0, 1, 0.6, 24],
  [0.06, 0.974, 0.58, 24],
  [0.14, 0.886, 0.51, 24],
  [0.23, 0.84, 0.37, 24],
  [0.4, 0.867, 0.21, 24],
  [0.53, 0.923, 0.31, 18],
  [0.65, 0.976, 0.56, 6],
  [0.78, 1, 0.83, 0],
  [0.91, 1, 0.98, 0],
  [1, 1, 1, 0],
];

const card = preview.map(([offset, scale]) => ({ offset, scale }));

const veil = preview.map(([offset, , brightness, blur]) => ({
  offset,
  backdropFilter: `blur(${blur}px) brightness(${brightness})`,
}));

const press = [
  [0, 1, 0.118],
  [0.03, 1.03, 0.34],
  [0.08, 1.07, 0.44],
  [0.12, 1.12, 0.455],
  [0.17, 1.11, 0.447],
  [0.22, 1.09, 0.4],
  [0.29, 1, 0.33],
  [0.35, 0.98, 0.28],
  [0.48, 0.97, 0.2],
  [0.58, 0.985, 0.157],
  [0.65, 1, 0.145],
  [1, 1, 0.118],
].map(([offset, scale, alpha]) => ({ offset, scale, background: `rgb(255 255 255 / ${alpha})` }));

const flipping = { duration: 390, delay: 50 };

export function Flip({ settings, update }: Props) {
  const profile = useProfile();

  return (
    <button
      className="flip"
      aria-label="Camera Chooser"
      onClick={(event) => {
        const viewfinder = document.querySelector(".viewfinder");

        event.currentTarget.animate(press, 650);
        viewfinder?.animate(card, flipping);
        viewfinder?.animate(veil, { ...flipping, pseudoElement: "::after" });
        update(flipCamera(profile, settings));
      }}
    >
      <FlipGlyph />
    </button>
  );
}
