import "./shutter.css";

export function Shutter({ movie, onPress }: { movie: boolean; onPress: () => void }) {
  return (
    <button className="shutter-button" aria-label={movie ? "Record" : "Take photo"} onClick={onPress}>
      <span />
    </button>
  );
}
