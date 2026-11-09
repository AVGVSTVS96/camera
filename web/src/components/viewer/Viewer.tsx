import { useLayoutEffect, useRef } from "react";
import { save, type Shot } from "../../capture.ts";
import { Status } from "./Status.tsx";
import "./viewer.css";

export function Viewer({ shots, close }: { shots: Shot[]; close: () => void }) {
  const strip = useRef<HTMLDivElement>(null);
  const empty = !shots.length;

  useLayoutEffect(() => {
    strip.current?.scrollTo({ left: strip.current.scrollWidth });
  }, []);

  function share() {
    const index = strip.current ? Math.round(strip.current.scrollLeft / strip.current.clientWidth) : shots.length - 1;
    const shot = shots[index];

    if (shot) save(shot.file).catch(() => {});
  }

  return (
    <section className="viewer" aria-label="Photo">
      {empty ? (
        <p className="empty">No Photos or Videos</p>
      ) : (
        <div className="viewer-strip" ref={strip}>
          {shots.map((shot) =>
            shot.file.type.startsWith("video/") ? (
              <video key={shot.url} src={shot.url} poster={shot.poster} controls playsInline />
            ) : (
              <img key={shot.url} src={shot.url} alt="" />
            ),
          )}
        </div>
      )}
      {empty && <Status />}
      {empty && <div className="viewer-home" />}
      {!empty && (
        <button className="viewer-share" aria-label="Share" onClick={share}>
          <svg
            width="22"
            height="28"
            viewBox="0 0 22 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 17V2M6.5 6.5 11 2l4.5 4.5M6 11H4.5A1.5 1.5 0 0 0 3 12.5v11A1.5 1.5 0 0 0 4.5 25h13a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 17.5 11H16" />
          </svg>
        </button>
      )}
      <button className="back" aria-label="Back" onClick={close}>
        <svg
          width="14.6"
          height="20.2"
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
