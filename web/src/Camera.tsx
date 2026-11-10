import { useEffect, useEffectEvent, useRef, useState } from "react";
import { record, snapshot, useCamera, type Recording as Take } from "./capture.ts";
import { crossfade } from "./crossfade.ts";
import { startPano, type Panorama } from "./pano.ts";
import { useLibrary } from "./library.ts";
import { AspectFlip } from "./components/aspect-flip/AspectFlip.tsx";
import { ControlsButton } from "./components/controls-button/ControlsButton.tsx";
import { ControlsPanel } from "./components/controls-panel/ControlsPanel.tsx";
import { Countdown } from "./components/countdown/Countdown.tsx";
import { DepthButton } from "./components/depth-button/DepthButton.tsx";
import { Flip } from "./components/flip/Flip.tsx";
import { Grid, Level } from "./components/grid/Grid.tsx";
import { InnerPreview } from "./components/inner-layout/InnerPreview.tsx";
import { Lighting } from "./components/lighting/Lighting.tsx";
import { Pano } from "./components/pano/Pano.tsx";
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
import { Viewfinder } from "./components/viewfinder/Viewfinder.tsx";
import { TopBar } from "./components/top-bar/TopBar.tsx";
import { Viewer } from "./components/viewer/Viewer.tsx";
import { Zoom } from "./components/zoom/Zoom.tsx";
import { preserve, remember, unseen } from "./memory.ts";
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
  const { shots, add } = useLibrary();
  const [shown, setShown] = useState(settings.tray);
  const [from, setFrom] = useState<{ x: number; y: number }>();
  const closing = shown && !settings.tray;

  if (settings.tray && !shown) setShown(true);

  const lock = useRef<HTMLButtonElement>(null);
  const take = useRef<Take>(undefined);
  const [pan, setPan] = useState<Panorama>();
  const { video, stream } = useCamera(settings, !still);
  const update: Update = (change) => setSettings((s) => ({ ...s, ...change }));
  const movie = movieModes.has(settings.mode);
  const counting = settings.countdown > 0;
  const busy = settings.holding || settings.recording || settings.panning || counting;
  const props = { settings, update };
  const open = settings.submenu;
  const styling = open === "Styles";

  const follow = useEffectEvent(() => {
    const pose = poseOf(innerWidth, innerHeight);
    const apply = () => setSettings((s) => ({ ...s, ...pose }));

    if (pose.display === settings.display) apply();
    else crossfade(apply, { duration: 308, easing: "cubic-bezier(0, 0, 0.58, 1)" });
  });

  useEffect(() => {
    if (still) return;

    addEventListener("resize", follow);

    return () => removeEventListener("resize", follow);
  }, [still]);

  useEffect(() => {
    if (still) return;

    if (settings.sheet === "intro" || settings.sheet === "styles") remember(settings.sheet);

    preserve(settings);
  }, [still, settings]);

  useEffect(() => {
    onSettings?.(settings);
  }, [onSettings, settings]);

  async function finish() {
    const current = take.current;

    if (!current || !video.current) return;

    take.current = undefined;
    update({ holding: false, recording: false, paused: false });
    const [file, frame] = await Promise.all([current.stop(), snapshot(video.current)]);
    add({ url: URL.createObjectURL(file), file, poster: frame.url, frame: frame.file });
  }

  async function sweep() {
    if (!pan) {
      if (!video.current?.videoWidth) return;

      const sideways = settings.orientation === "landscape";
      setPan(startPano(video.current, sideways ? "y" : "x", settings.reverse ? -1 : 1, sweep));

      return update({ panning: true });
    }

    const shot = await pan.stop();
    setPan(undefined);
    update({ panning: false });

    if (shot) add(shot);
  }

  async function capture() {
    if (!video.current || !stream) return;

    if (settings.mode === "pano") return sweep();

    if (take.current) return finish();

    if (!movie) return add(await snapshot(video.current));

    take.current = record(stream);
    crossfade(() => update({ recording: true }), { delay: 60, duration: 360, easing: "cubic-bezier(0, 0, 0.58, 1)" });
  }

  function shutter() {
    if (settings.countdown) return update({ countdown: 0 });

    if (settings.timer && !take.current) return update({ countdown: settings.timer });

    return capture();
  }

  function pause() {
    const paused = !settings.paused;

    if (paused) take.current?.pause();
    else take.current?.resume();

    update({ paused });
  }

  async function takePicture() {
    if (video.current) add(await snapshot(video.current));
  }

  function hold() {
    if (!stream) return;

    take.current = record(stream);
    update({ holding: true });
  }

  const count = useEffectEvent(() => {
    let left = settings.countdown;

    return setInterval(() => {
      left -= 1;
      update({ countdown: left });

      if (!left) capture();
    }, 1000);
  });

  useEffect(() => {
    if (!counting || still) return;

    const every = count();

    return () => clearInterval(every);
  }, [counting, still]);

  const quicktake = {
    mode: settings.mode,
    recording: settings.recording || settings.panning,
    holding: settings.holding,
    lock,
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
      data-countdown={counting || undefined}
      data-holding={settings.holding || undefined}
      data-wide={settings.aspect === "16:9" || undefined}
      data-recording={settings.recording || undefined}
      data-panning={settings.panning || undefined}
      data-stopped={settings.stopped || undefined}
      style={still ? { backgroundImage: `url(/plates/${still}.png)` } : undefined}
    >
      <Viewfinder {...props} still={!!still}>
        {!still && <video ref={video} autoPlay playsInline muted data-facing={settings.facing} />}
        {settings.level && !still && <Level />}
      </Viewfinder>
      {still && settings.display === "inner" && <InnerPreview />}
      {settings.sheet && settings.sheet !== "choose" && <div className="sheet-scrim" />}
      {settings.grid && <Grid />}
      {settings.mode === "pano" && !settings.tray && !settings.submenu && <Pano {...props} pan={pan} />}
      {settings.recording || settings.holding ? (
        <Recording settings={settings} lockRef={lock} still={!!still} onPause={pause} onStill={takePicture} />
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
          <div className="row shutter">
            {movie
              ? profile.macro && <Macro {...props} />
              : !busy &&
                settings.mode !== "portrait" &&
                settings.mode !== "pano" && (
                  <DepthButton on={settings.depth} toggle={() => update({ depth: !settings.depth })} />
                )}
            <Shutter {...quicktake} />
            {(profile.smartTake || settings.on.includes("Smart Take")) && !movie && !busy && !settings.submenu && (
              <SmartTake />
            )}
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
            {!settings.submenu && !busy && <Thumbnail shot={shots.at(-1)} open={() => update({ viewer: true })} />}
          </div>
          {!settings.submenu && !busy && <Flip {...props} />}
          {!busy && !settings.submenu && (
            <ModeDial
              selected={settings.mode}
              select={(mode) =>
                update({
                  ...switchMode(profile, settings, mode),
                  sheet: mode === "cinematic" ? unseen("intro") : undefined,
                })
              }
            />
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
      {!settings.tray && !styling && !settings.countdown && <Zoom {...props} />}
      {styling && <SubmenuStyles {...props} />}
      {open === "Timer" && <SubmenuTimer {...props} />}
      {open === "Center Stage" && <SubmenuCenterStage {...props} />}
      <AspectFlip {...props} />
      {settings.viewer && <Viewer shots={shots} close={() => update({ viewer: false })} />}
      {settings.sheet && <Sheet kind={settings.sheet} update={update} />}
      {still && settings.display === "outer" && !settings.holding && !settings.recording && <div className="system" />}
    </main>
  );
}
