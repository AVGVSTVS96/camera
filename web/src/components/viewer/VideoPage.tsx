import { useRef, useState } from "react";
import type { Shot } from "../../capture.ts";

function clock(seconds: number) {
  const s = Math.max(0, Math.round(seconds));

  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function VideoPage({ shot }: { shot: Shot }) {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const v = video.current!;

    if (v.paused) void v.play();
    else v.pause();
  }

  return (
    <div className="viewer-page">
      <video
        ref={video}
        src={shot.url}
        poster={shot.poster}
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 0)}
      />
      <div className="viewer-scrub" onClick={(e) => e.stopPropagation()}>
        <button className="viewer-play" aria-label={playing ? "Pause" : "Play"} onClick={toggle}>
          <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
            {playing ? <path d="M1 0h4.5v18H1zM10.5 0H15v18h-4.5z" /> : <path d="M1.5 1.2v15.6L15 9z" />}
          </svg>
        </button>
        <span>{clock(time)}</span>
        <input
          type="range"
          aria-label="Scrubber"
          min={0}
          max={length || 1}
          step="any"
          value={time}
          onChange={(e) => {
            video.current!.currentTime = Number(e.target.value);
          }}
        />
        <span>{clock(length)}</span>
      </div>
    </div>
  );
}
