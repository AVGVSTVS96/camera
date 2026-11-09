import { useEffect, useEffectEvent, useRef, useState } from "react";
import { record, snapshot, useCamera, type Shot } from "./capture.ts";
import { AspectFlip } from "./components/aspect-flip/AspectFlip.tsx";
import { ControlsButton } from "./components/controls-button/ControlsButton.tsx";
import { ControlsPanel } from "./components/controls-panel/ControlsPanel.tsx";
import { Countdown } from "./components/countdown/Countdown.tsx";
import { DepthButton } from "./components/depth-button/DepthButton.tsx";
import { Flip } from "./components/flip/Flip.tsx";
import { Grid, Level } from "./components/grid/Grid.tsx";
import { InnerPreview } from "./components/inner-layout/InnerPreview.tsx";
import { Lighting } from "./components/lighting/Lighting.tsx";
import { Macro } from "./components/macro/Macro.tsx";
import { SubmenuAspectRatio } from "./components/submenu-aspect-ratio/SubmenuAspectRatio.tsx";
import { SubmenuFocus } from "./components/submenu-focus/SubmenuFocus.tsx";
import { ModeDial } from "./components/mode-dial/ModeDial.tsx";
import { Recording } from "./components/recording/Recording.tsx";
import { Sheet } from "./components/sheets/Sheet.tsx";
import { Shutter } from "./components/shutter/Shutter.tsx";
import { SubmenuResolution } from "./components/submenu-resolution/SubmenuResolution.tsx";
import { SubmenuCenterStage } from "./components/submenu-center-stage/SubmenuCenterStage.tsx";
import { SubmenuTimer } from "./components/submenu-timer/SubmenuTimer.tsx";
import { SubmenuStyles } from "./components/submenu-styles/SubmenuStyles.tsx";
import { SubmenuDepth } from "./components/submenu-depth/SubmenuDepth.tsx";
import { SubmenuFlash } from "./components/submenu-flash/SubmenuFlash.tsx";
import { SubmenuExposure } from "./components/submenu-exposure/SubmenuExposure.tsx";
import { SmartTake } from "./components/smart-take/SmartTake.tsx";
import { SubmenuVideoResolution } from "./components/submenu-video-resolution/SubmenuVideoResolution.tsx";
import { SubmenuVideoFormat } from "./components/submenu-video-format/SubmenuVideoFormat.tsx";
import { SubmenuLivePhoto } from "./components/submenu-live-photo/SubmenuLivePhoto.tsx";
import { SubmenuNightMode } from "./components/submenu-night-mode/SubmenuNightMode.tsx";
import { SubmenuWhiteBalance } from "./components/submenu-white-balance/SubmenuWhiteBalance.tsx";
import { Thumbnail } from "./components/thumbnail/Thumbnail.tsx";
import { TopBar } from "./components/top-bar/TopBar.tsx";
import { Viewer } from "./components/viewer/Viewer.tsx";
import { Zoom } from "./components/zoom/Zoom.tsx";
import { useProfile } from "./profile.ts";
import { movieModes, poseOf, switchMode, type Settings, type Update } from "./state.ts";

interface CameraProps {
  initial: Settings;
  still?: string;
  onSettings?: (settings: Settings) => void;
}

export function Camera({ initial, still, onSettings }: CameraProps) {
  const profile = useProfile();
  const [settings, setSettings] = useState(initial);
  const [shot, setShot] = useState<Shot>();
  const [shown, setShown] = useState(settings.tray);
  const [from, setFrom] = useState<{ x: number; y: number }>();
  const closing = shown && !settings.tray;

  if (settings.tray && !shown) setShown(true);

  const stop = useRef<() => Promise<File>>(undefined);
  const { video, stream, error } = useCamera(settings, !still);
  const update: Update = (change) => setSettings((s) => ({ ...s, ...change }));
  const movie = movieModes.has(settings.mode);
  const busy = settings.holding || settings.recording || settings.countdown > 0;
  const props = { settings, update };
  const open = settings.submenu;
  const styling = open === "Styles";

  useEffect(() => {
    if (still) return;

    const follow = () => setSettings((s) => ({ ...s, ...poseOf(innerWidth, innerHeight) }));
    addEventListener("resize", follow);

    return () => removeEventListener("resize", follow);
  }, [still]);

  useEffect(() => {
    onSettings?.(settings);
  }, [onSettings, settings]);

  async function finish() {
    const [file, frame] = await Promise.all([stop.current!(), snapshot(video.current!)]);
    stop.current = undefined;
    update({ holding: false, recording: false });
    setShot({ url: URL.createObjectURL(file), file, poster: frame.url });
  }

  async function capture() {
    if (!video.current || !stream) return;

    if (stop.current) return finish();

    if (!movie) return setShot(await snapshot(video.current));

    stop.current = record(stream);
    update({ recording: true });
  }

  function shutter() {
    if (settings.countdown) return update({ countdown: 0 });

    if (settings.timer && !stop.current) return update({ countdown: settings.timer });

    return capture();
  }

  function hold() {
    if (!stream) return;

    stop.current = record(stream);
    update({ holding: true });
  }

  const tick = useEffectEvent((left: number) => {
    update({ countdown: left - 1 });

    if (left === 1) capture();
  });

  useEffect(() => {
    if (!settings.countdown) return;

    const next = setTimeout(tick, 1000, settings.countdown);

    return () => clearTimeout(next);
  }, [settings.countdown]);

  const quicktake = {
    mode: settings.mode,
    orientation: settings.orientation,
    recording: settings.recording,
    holding: settings.holding,
    onPress: shutter,
    onHold: hold,
    onLock: () => update({ holding: false, recording: true }),
    onRelease: finish,
  };

  return (
    <main
      className="screen"
      data-mode={settings.mode}
      data-movie={movie || undefined}
      data-display={settings.display}
      data-orientation={settings.orientation}
      data-fold={settings.fold}
      data-profile={profile.name}
      data-facing={settings.facing}
      data-sheet={settings.sheet}
      data-submenu={open ?? undefined}
      data-styles={styling || undefined}
      data-countdown={settings.countdown > 0 || undefined}
      data-holding={settings.holding || undefined}
      data-wide={settings.aspect === "16:9" || undefined}
      data-recording={settings.recording || undefined}
      style={still ? { backgroundImage: `url(/plates/${still}.png)` } : undefined}
    >
      <div className="viewfinder">
        {!still && <video ref={video} autoPlay playsInline muted data-facing={settings.facing} />}
        {settings.level && !still && <Level />}
      </div>
      {still && settings.display === "inner" && <InnerPreview />}
      {settings.sheet && settings.sheet !== "choose" && <div className="sheet-scrim" />}
      {settings.grid && <Grid />}
      {settings.recording || settings.holding ? (
        <Recording settings={settings} />
      ) : (
        (profile.badges || settings.tray) && (
          <div className="row top">
            <TopBar {...props} />
          </div>
        )
      )}
      {shown && <ControlsPanel {...props} from={from} closing={closing} gone={() => setShown(false)} />}
      {settings.tray ? null : styling ? (
        <div className="row shutter">
          <Shutter {...quicktake} />
        </div>
      ) : (
        <>
          {!settings.countdown && <Zoom {...props} />}
          <div className="row shutter">
            {movie ? profile.macro && <Macro {...props} /> : !busy && <DepthButton on={settings.depth} />}
            <Shutter {...quicktake} />
            {profile.smartTake && !movie && !busy && !settings.submenu && <SmartTake />}
            {!settings.submenu && !busy && (
              <ControlsButton
                open={() => {
                  const { x, y, width, height } = document.querySelector(".shutter-button")!.getBoundingClientRect();
                  setFrom({ x: x + width / 2, y: y + height / 2 });
                  update({ tray: true, expanded: false });
                }}
              />
            )}
          </div>
          <div className="row modes">
            {!settings.submenu && !busy && <Thumbnail shot={shot} open={() => update({ viewer: true })} />}
          </div>
          {!settings.submenu && !busy && <Flip {...props} />}
          {!busy && !settings.submenu && (
            <ModeDial selected={settings.mode} select={(mode) => update(switchMode(profile, settings, mode))} />
          )}
        </>
      )}
      {open === "Exposure" && <SubmenuExposure {...props} />}
      {open === "Depth" && <SubmenuDepth {...props} />}
      {open === "Focus" && <SubmenuFocus {...props} />}
      {open === "Video Format" && <SubmenuVideoFormat {...props} />}
      {open === "Video Resolution" && <SubmenuVideoResolution {...props} />}
      {open === "Live Photo" && <SubmenuLivePhoto {...props} />}
      {open === "Aspect Ratio" && <SubmenuAspectRatio {...props} />}
      {open === "Flash" && <SubmenuFlash {...props} />}
      {open === "Resolution" && <SubmenuResolution {...props} />}
      {open === "White Balance" && <SubmenuWhiteBalance {...props} />}
      {open === "Night Mode" && <SubmenuNightMode {...props} />}
      <Countdown settings={settings} />
      {profile.lighting !== false &&
        !settings.tray &&
        !styling &&
        !movie &&
        !settings.holding &&
        !settings.countdown && <Lighting {...props} />}
      {styling && <SubmenuStyles {...props} />}
      {open === "Timer" && <SubmenuTimer {...props} />}
      {open === "Center Stage" && <SubmenuCenterStage {...props} />}
      <AspectFlip {...props} />
      {settings.viewer && <Viewer shot={shot} close={() => update({ viewer: false })} />}
      {settings.sheet && <Sheet kind={settings.sheet} update={update} />}
      {still && settings.display === "outer" && !settings.holding && !settings.recording && <div className="system" />}
      {error && <p className="error">{error}</p>}
    </main>
  );
}
