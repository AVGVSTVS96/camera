import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useProfile } from "../../profile.ts";
import type { Mode } from "../../state.ts";
import "./mode-dial.css";

export function ModeDial({ selected, select }: { selected: Mode; select: (mode: Mode) => void }) {
  const { modes, name } = useProfile();
  const labels = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [settled, setSettled] = useState(false);
  const [fonts, setFonts] = useState(0);

  useEffect(() => {
    document.fonts.ready.then(() => setFonts(1));
    setSettled(true);
  }, []);

  useLayoutEffect(() => {
    const label = labels.current?.querySelector<HTMLElement>(`[data-mode="${selected}"]`);

    if (label) setOffset(-(label.offsetLeft + label.offsetWidth / 2));
  }, [selected, fonts]);

  return (
    <div className="dial" data-profile={name} aria-label="Camera Mode">
      <div className="window">
        <div className="labels" ref={labels} data-settled={settled || undefined} style={{ translate: `${offset}px` }}>
          {modes.map((mode) => (
            <button key={mode} data-mode={mode} data-on={mode === selected || undefined} onClick={() => select(mode)}>
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
