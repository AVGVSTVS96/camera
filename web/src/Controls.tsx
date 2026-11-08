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
import { useProfile } from "./profile.ts";
import { movieModes, type Mode, type Settings } from "./state.ts";

interface Props {
  settings: Settings;
  update: Update;
}

function Format({ text }: { text: string }) {
  const [name, detail] = text.split(" ");

  return (
    <>
      <b>{name}</b>
      <small className="mono">{detail}</small>
    </>
  );
}

export function TopBar({ settings, update }: Props) {
  const profile = useProfile();

  if (settings.recording) {
    return (
      <div className="row top">
        <time className="timer">00:00:00</time>
      </div>
    );
  }

  const movie = movieModes.has(settings.mode);

  if (!profile.badges && !settings.tray) return null;

  return (
    <div className="row top">
      {settings.tray && (
        <button className="glass round small plus" aria-label="Add control">
          <PlusGlyph />
        </button>
      )}
      {profile.badges && (
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
                <Format text={profile.videoFormat} />
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
                <Format text={profile.photoFormat} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function zoomLabel(value: number, active: boolean) {
  const text = String(Math.round(value * 10) / 10).replace(/^0/, "");

  return active ? `${text}×` : text;
}

export function ZoomStops({ settings, update }: Props) {
  const stops = useProfile().zoom[`${settings.facing}-${settings.mode}`]?.stops ?? [];
  const active = stops.indexOf(Math.max(...stops.filter((s) => s <= settings.zoom + 0.001)));

  if (!stops.length) return null;

  return (
    <div className="row zoom">
      <div className="stops">
        {stops.map((stop, i) => (
          <button key={i} data-on={i === active || undefined} onClick={() => update({ zoom: stop })}>
            <span className="glyph">{zoomLabel(i === active ? settings.zoom : stop, i === active)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShutterRow({ settings, update, onShutter }: Props & { onShutter: () => void }) {
  const profile = useProfile();
  const movie = movieModes.has(settings.mode);

  return (
    <div className="row shutter">
      {movie ? (
        profile.macro && (
          <button
            className="glass round lead"
            data-on={settings.macro || undefined}
            aria-label="Macro"
            onClick={() => update({ macro: !settings.macro })}
          >
            <Macro />
          </button>
        )
      ) : (
        <button className="glass round lead dim" aria-label="Depth">
          <DepthOff />
        </button>
      )}
      <button className="shutter-button" aria-label={movie ? "Record" : "Take photo"} onClick={onShutter}>
        <span />
      </button>
      {profile.smartTake && !movie && !settings.recording && (
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
