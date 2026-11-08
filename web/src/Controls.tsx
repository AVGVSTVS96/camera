import { useLayoutEffect, useRef, useState } from "react";
import type { Update } from "./Camera.tsx";
import {
  BoltAuto,
  BoltSlash,
  DepthOff,
  LiveOff,
  Macro,
  Moon,
  More,
  Plus as PlusGlyph,
  RunSlash,
  Tone,
} from "./icons.tsx";
import { modes, movieModes, type Mode, type Settings } from "./state.ts";

interface Props {
  settings: Settings;
  update: Update;
}

export function TopBar({ settings, update }: Props) {
  if (settings.recording) {
    return (
      <div className="row top">
        <time className="timer">00:00:00</time>
      </div>
    );
  }

  const movie = movieModes.has(settings.mode);

  return (
    <div className="row top">
      {settings.tray && (
        <button className="glass round small plus" aria-label="Add control">
          <PlusGlyph />
        </button>
      )}
      <div className="top-items">
        {movie ? (
          <>
            <button aria-label="Flash" onClick={() => update({ flash: settings.flash === "on" ? "off" : "on" })}>
              <BoltSlash />
            </button>
            <button aria-label="Action mode">
              <RunSlash />
            </button>
            <button className="badge" aria-label="Video format">
              <b>4K</b>
              <small className="mono">30</small>
            </button>
          </>
        ) : (
          <>
            <button aria-label="Flash">
              <BoltAuto />
            </button>
            <button
              aria-label="Live Photo"
              data-on={settings.live || undefined}
              onClick={() => update({ live: !settings.live })}
            >
              <LiveOff />
            </button>
            <button
              aria-label="Night mode"
              data-on={settings.night || undefined}
              onClick={() => update({ night: !settings.night })}
            >
              <Moon />
            </button>
            <button className="badge" aria-label="Photo format">
              <b>HEIF</b>
              <small>48</small>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const stops = [0.5, 1, 2];

function zoomLabel(value: number, active: boolean) {
  const text = String(Math.round(value * 10) / 10).replace(/^0/, "");

  return active ? `${text}×` : text;
}

export function ZoomStops({ settings, update }: Props) {
  const active = stops.findLast((s) => settings.zoom >= s - 0.001);

  return (
    <div className="row zoom">
      <div className="stops">
        {stops.map((stop) => (
          <button key={stop} data-on={stop === active || undefined} onClick={() => update({ zoom: stop })}>
            <span className="glyph">{zoomLabel(stop === active ? settings.zoom : stop, stop === active)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShutterRow({ settings, update, onShutter }: Props & { onShutter: () => void }) {
  const movie = movieModes.has(settings.mode);

  return (
    <div className="row shutter">
      {movie ? (
        <button
          className="glass round lead"
          data-on={settings.macro || undefined}
          aria-label="Macro"
          onClick={() => update({ macro: !settings.macro })}
        >
          <Macro />
        </button>
      ) : (
        <button className="glass round lead dim" aria-label="Depth">
          <DepthOff />
        </button>
      )}
      <button className="shutter-button" aria-label={movie ? "Record" : "Take photo"} onClick={onShutter}>
        <span />
      </button>
      {!movie && !settings.recording && (
        <button className="glass round large tone" aria-label="Styles">
          <Tone />
        </button>
      )}
      <button
        className="glass round trail"
        data-on={!movie || undefined}
        aria-label="Camera controls"
        onClick={() => update({ tray: true })}
      >
        <More />
      </button>
    </div>
  );
}

export function ModeDial({ selected, select }: { selected: Mode; select: (mode: Mode) => void }) {
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
