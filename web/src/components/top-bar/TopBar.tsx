import { useProfile } from "../../profile.ts";
import { movieModes, type Props, type Submenu } from "../../state.ts";
import { Bolt, Live, Moon, Plus, Run } from "./icons.tsx";
import "./top-bar.css";

function Format({ name, detail }: { name: string; detail: string | number }) {
  return (
    <>
      <b>{name}</b>
      <small className="mono">{detail}</small>
    </>
  );
}

export function TopBar({ settings, update }: Props) {
  const profile = useProfile();
  const { flash, live, night, resolution, mode, videoResolution } = settings;
  const movie = movieModes.has(mode);
  const front = settings.facing === "front";
  const flashes = mode === "photo" || mode === "portrait" || (movie && !front && mode !== "time-lapse");
  const format = settings.formats[mode] ?? { resolution: videoResolution, rate: 30 };
  const action = settings.on.includes("Action Mode");
  const open = (submenu: Submenu) => update({ submenu, tray: false, expanded: false });

  return (
    <>
      {profile.badges && settings.tray && settings.display !== "inner" && (
        <button className="glass round small plus" aria-label="Add control">
          <Plus />
        </button>
      )}
      {profile.badges && (
        <div className="top-items">
          {flashes && (
            <button aria-label="Flash" data-on={flash === "on" || undefined} onClick={() => open("Flash")}>
              <Bolt mode={flash} />
            </button>
          )}
          {mode === "video" && !front && (
            <button
              aria-label="Action mode"
              data-on={action || undefined}
              onClick={() =>
                update({
                  on: action ? settings.on.filter((t) => t !== "Action Mode") : [...settings.on, "Action Mode"],
                })
              }
            >
              <Run off={!action} />
            </button>
          )}
          {movie && (
            <button className="badge glyph" aria-label="Video format" onClick={() => open("Video Format")}>
              <Format name={format.resolution} detail={format.rate} />
            </button>
          )}
          {mode === "photo" && (
            <>
              <button aria-label="Live Photo" data-on={live === "on" || undefined} onClick={() => open("Live Photo")}>
                <Live off={live !== "on"} />
              </button>
              <button aria-label="Night mode" data-on={night !== "off" || undefined} onClick={() => open("Night Mode")}>
                <Moon off={night === "off"} />
              </button>
              <button className="badge glyph" aria-label="Photo format" onClick={() => open("Resolution")}>
                <Format name="HEIF" detail={resolution} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
