import { BoltAuto, LiveOff, Moon } from "../../icons.tsx";
import { useProfile } from "../../profile.ts";
import { movieModes, type Props } from "../../state.ts";
import { BoltSlash, Plus, RunSlash } from "./icons.tsx";
import "./top-bar.css";

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
  const movie = movieModes.has(settings.mode);

  return (
    <>
      {settings.tray && (
        <button className="glass round small plus" aria-label="Add control">
          <Plus />
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
                data-on={settings.live === "on" || undefined}
                onClick={() => update({ live: settings.live === "on" ? "off" : "on" })}
              >
                <LiveOff />
              </button>
              <button
                aria-label="Night mode"
                data-on={settings.night !== "off" || undefined}
                onClick={() => update({ night: settings.night === "off" ? "auto" : "off" })}
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
    </>
  );
}
