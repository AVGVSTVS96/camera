import { useRef, useState } from "react";
import { record, save, snapshot, useCamera, type Shot } from "./capture.ts";
import { ModeDial, ShutterRow, TopBar, ZoomStops } from "./Controls.tsx";
import { Flip as FlipGlyph } from "./icons.tsx";
import { useProfile } from "./profile.ts";
import { Tray } from "./Tray.tsx";
import { movieModes, type Settings } from "./state.ts";
import { Viewer } from "./Viewer.tsx";

export type Update = (change: Partial<Settings>) => void;

export function Camera({ initial, still }: { initial: Settings; still?: string }) {
  const profile = useProfile();
  const [settings, setSettings] = useState(initial);
  const [shot, setShot] = useState<Shot>();
  const stop = useRef<() => Promise<File>>(undefined);
  const { video, stream, error } = useCamera(settings, !still);
  const update: Update = (change) => setSettings((s) => ({ ...s, ...change }));
  const movie = movieModes.has(settings.mode);

  async function shutter() {
    if (!video.current || !stream) return;

    if (!movie) return setShot(await snapshot(video.current));

    if (!stop.current) {
      stop.current = record(stream);

      return update({ recording: true });
    }

    const [file, frame] = await Promise.all([stop.current(), snapshot(video.current)]);
    stop.current = undefined;
    update({ recording: false });
    setShot({ url: URL.createObjectURL(file), file, poster: frame.url });
  }

  return (
    <main
      className="screen"
      data-mode={settings.mode}
      data-movie={movie || undefined}
      data-display={settings.display}
      data-orientation={settings.orientation}
      data-fold={settings.fold}
      data-recording={settings.recording || undefined}
      style={still ? { backgroundImage: `url(/plates/${still}.png)` } : undefined}
    >
      <div className="viewfinder">
        {!still && <video ref={video} autoPlay playsInline muted data-facing={settings.facing} />}
        {settings.grid && <div className="grid" />}
        {settings.level && <div className="level" />}
      </div>
      <TopBar settings={settings} update={update} />
      {settings.tray ? (
        <Tray settings={settings} update={update} />
      ) : (
        <>
          <ZoomStops settings={settings} update={update} />
          <ShutterRow settings={settings} update={update} onShutter={shutter} />
          <div className="row modes">
            <button
              className="thumb lead"
              data-empty={!profile.library || undefined}
              aria-label="Photos"
              onClick={() => update({ viewer: true })}
            >
              {shot && <img src={shot.poster ?? shot.url} alt="" />}
            </button>
            {!settings.recording && <ModeDial selected={settings.mode} select={(mode) => update({ mode })} />}
            <button
              className="glass round trail"
              aria-label="Switch camera"
              onClick={() => update({ facing: settings.facing === "front" ? "back" : "front" })}
            >
              <FlipGlyph />
            </button>
          </div>
        </>
      )}
      {settings.viewer && (
        <Viewer shot={shot} close={() => update({ viewer: false })} share={shot && (() => save(shot.file))} />
      )}
      {still && settings.display === "outer" && <div className="system" />}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
