import { useRef, useState } from "react";
import { record, save, snapshot, useCamera, type Shot } from "./capture.ts";
import { ControlsButton } from "./components/controls-button/ControlsButton.tsx";
import { ControlsPanel } from "./components/controls-panel/ControlsPanel.tsx";
import { DepthButton } from "./components/depth-button/DepthButton.tsx";
import { Flip } from "./components/flip/Flip.tsx";
import { Grid, Level } from "./components/grid/Grid.tsx";
import { InnerViewer } from "./components/inner-layout/InnerViewer.tsx";
import { Macro } from "./components/macro/Macro.tsx";
import { ModeDial } from "./components/mode-dial/ModeDial.tsx";
import { Recording } from "./components/recording/Recording.tsx";
import { Shutter } from "./components/shutter/Shutter.tsx";
import { SmartTake } from "./components/smart-take/SmartTake.tsx";
import { Thumbnail } from "./components/thumbnail/Thumbnail.tsx";
import { TopBar } from "./components/top-bar/TopBar.tsx";
import { Viewer } from "./components/viewer/Viewer.tsx";
import { Zoom } from "./components/zoom/Zoom.tsx";
import { useProfile } from "./profile.ts";
import { movieModes, type Settings, type Update } from "./state.ts";

export function Camera({ initial, still }: { initial: Settings; still?: string }) {
  const profile = useProfile();
  const [settings, setSettings] = useState(initial);
  const [shot, setShot] = useState<Shot>();
  const stop = useRef<() => Promise<File>>(undefined);
  const { video, stream, error } = useCamera(settings, !still);
  const update: Update = (change) => setSettings((s) => ({ ...s, ...change }));
  const movie = movieModes.has(settings.mode);
  const props = { settings, update };

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
        {settings.level && <Level />}
      </div>
      {settings.grid && <Grid />}
      {settings.recording ? (
        <div className="row top">
          <Recording />
        </div>
      ) : (
        (profile.badges || settings.tray) && (
          <div className="row top">
            <TopBar {...props} />
          </div>
        )
      )}
      {settings.tray ? (
        <ControlsPanel update={update} />
      ) : (
        <>
          <div className="row zoom">
            <Zoom {...props} />
          </div>
          <div className="row shutter">
            {movie ? profile.macro && <Macro {...props} /> : <DepthButton />}
            <Shutter movie={movie} onPress={shutter} />
            {profile.smartTake && !movie && !settings.recording && <SmartTake />}
            <ControlsButton movie={movie} open={() => update({ tray: true })} />
          </div>
          <div className="row modes">
            <Thumbnail shot={shot} open={() => update({ viewer: true })} />
            {!settings.recording && <ModeDial selected={settings.mode} select={(mode) => update({ mode })} />}
            <Flip {...props} />
          </div>
        </>
      )}
      {settings.viewer && (
        <Viewer shot={shot} close={() => update({ viewer: false })} share={shot && (() => save(shot.file))} />
      )}
      {settings.viewer && settings.display === "inner" && <InnerViewer empty={!shot} />}
      {still && settings.display === "outer" && <div className="system" />}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
