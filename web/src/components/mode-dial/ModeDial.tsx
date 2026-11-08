import { useLayoutEffect, useRef, useState } from "react";
import { useProfile } from "../../profile.ts";
import type { Mode } from "../../state.ts";
import "./mode-dial.css";

export function ModeDial({ selected, select }: { selected: Mode; select: (mode: Mode) => void }) {
  const { modes } = useProfile();
  const labels = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const label = labels.current?.querySelector<HTMLElement>(`[data-mode="${selected}"]`);

    if (label) setOffset(-(label.offsetLeft + label.offsetWidth / 2));
  }, [selected]);

  return (
    <div className="dial">
      <div className="pill" />
      <div className="labels" ref={labels} style={{ translate: `${offset}px` }}>
        {modes.map((mode) => (
          <button key={mode} data-mode={mode} data-on={mode === selected || undefined} onClick={() => select(mode)}>
            {mode.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
