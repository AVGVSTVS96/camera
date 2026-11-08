import type { Shot } from "../../capture.ts";
import "./viewer.css";

export function Viewer({ shot, close }: { shot?: Shot; close: () => void }) {
  const video = shot?.file.type.startsWith("video/");

  return (
    <section className="viewer" aria-label="Photo">
      {shot ? (
        video ? (
          <video src={shot.url} poster={shot.poster} controls playsInline />
        ) : (
          <img src={shot.url} alt="" />
        )
      ) : (
        <p className="empty">No Photos or Videos</p>
      )}
      <button className="back" aria-label="Back" onClick={close}>
        <svg
          width="13"
          height="18"
          viewBox="0 0 13 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 2 3 9l8 7" />
        </svg>
      </button>
    </section>
  );
}
