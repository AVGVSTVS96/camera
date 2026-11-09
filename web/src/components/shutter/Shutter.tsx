import type { Mode } from "../../state.ts";
import "./shutter.css";

const movies: Partial<Record<Mode, [string, string]>> = {
  "slo-mo": ["Record Slomo video", "Stop Slomo video"],
  "time-lapse": ["Record time lapse video", "Stop time lapse video"],
  video: ["Record Video", "Stop Recording Video"],
  cinematic: ["Record Video", "Stop Recording Video"],
};

interface ShutterProps {
  mode: Mode;
  recording: boolean;
  onPress: () => void;
}

export function Shutter({ mode, recording, onPress }: ShutterProps) {
  const label = movies[mode]?.[recording ? 1 : 0] ?? "Take Picture";

  return (
    <button className="shutter-button" aria-label={label} onClick={onPress}>
      <span />
    </button>
  );
}
