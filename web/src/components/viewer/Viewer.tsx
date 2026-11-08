import type { Shot } from "../../capture.ts";
import "./viewer.css";

export function Viewer({ shot, close, share }: { shot?: Shot; close: () => void; share?: () => void }) {
  const video = shot?.file.type.startsWith("video/");

  return (
    <section className="viewer" aria-label="Photo">
      {shot &&
        (video ? <video src={shot.url} poster={shot.poster} controls playsInline /> : <img src={shot.url} alt="" />)}
      <button className="glass round small back" aria-label="Back" onClick={close}>
        <svg
          width="12"
          height="20"
          viewBox="0 0 12 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 2 2 10l8 8" />
        </svg>
      </button>
      <nav className="glass toolbar">
        <button aria-label="Share" disabled={!share} onClick={share}>
          <svg
            width="22"
            height="26"
            viewBox="0 0 22 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 16V2m-5 5 5-5 5 5M7 10H4v14h14V10h-3" />
          </svg>
        </button>
      </nav>
    </section>
  );
}
