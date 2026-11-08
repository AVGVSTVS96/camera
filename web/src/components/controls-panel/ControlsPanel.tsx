import type { ReactNode } from "react";
import { useProfile } from "../../profile.ts";
import type { Props, Settings } from "../../state.ts";
import { arrange } from "./layout.ts";
import {
  Action,
  Adaptive,
  Aspect,
  Bolt,
  Constant,
  Depth,
  DepthOff,
  Exposure,
  Focus,
  Framing,
  LivePhoto,
  NightMode,
  SmartTake,
  Styles,
  TimerOff,
  WhiteBalance,
} from "./icons.tsx";
import "./controls-panel.css";

interface Control {
  label: string;
  short?: string;
  glyph: ReactNode;
  on?: boolean;
}

function Stack({ top, bottom, turn = 0 }: { top: string; bottom: string; turn?: number }) {
  return (
    <span className="badge tray-stack" style={{ rotate: `${turn}deg` }}>
      <b>{top}</b>
      <b className="mono">{bottom}</b>
    </span>
  );
}

function controlsFor(settings: Settings, photoFormat: string): Control[] {
  const { mode, facing, flash, on, display, orientation } = settings;
  const front = facing === "front";
  const movie = mode !== "photo" && mode !== "portrait";
  const turn = orientation === "landscape" ? 90 : display === "inner" ? 180 : 0;
  const [photoName = "", photoDetail = ""] = photoFormat.split(" ");
  const fps = mode === "slo-mo" ? "120" : "30";

  const control = {
    flash: { label: "Flash", glyph: <Bolt flash={flash} /> },
    live: { label: "Live", glyph: <LivePhoto /> },
    aspect: { label: "Aspect", glyph: <Aspect /> },
    timer: { label: "Timer", glyph: <TimerOff /> },
    exposure: { label: "Exposure", glyph: <Exposure /> },
    styles: { label: "Styles", glyph: <Styles /> },
    depth: { label: "Depth", glyph: mode === "photo" ? <DepthOff /> : <Depth /> },
    night: { label: "Night Mode", glyph: <NightMode /> },
    resolution: { label: "Resolution", glyph: <Stack top={photoName} bottom={photoDetail} /> },
    framing: { label: "Framing", glyph: <Framing /> },
    focus: { label: "Focus", glyph: <Focus /> },
    balance: { label: "White Balance", short: "AWB", glyph: <WhiteBalance /> },
    smart: { label: "Smart Take", glyph: <SmartTake />, on: on.includes("Smart Take") },
    format: { label: "Format", glyph: <Stack top="HD" bottom={fps} /> },
    action: { label: "Action", glyph: <Action on={on.includes("Action Mode")} />, on: on.includes("Action Mode") },
    lapse: {
      label: "Adaptive",
      glyph: on.includes("Time-Lapse Mode") ? <Adaptive /> : <Constant />,
      on: on.includes("Time-Lapse Mode"),
    },
    quality: { label: "Resolution", glyph: <Stack top="HD" bottom="30" turn={turn} /> },
  };

  switch (mode) {
    case "portrait":
      return [
        control.flash,
        control.aspect,
        control.timer,
        control.exposure,
        control.styles,
        control.depth,
        control.balance,
      ];
    case "video":
      return front
        ? [control.exposure, control.format, control.balance]
        : [control.flash, control.exposure, control.action, control.format, control.focus, control.balance];
    case "slo-mo":
      return [control.flash, control.exposure, control.format, control.focus, control.balance];
    case "time-lapse":
      return [control.exposure, control.quality, control.lapse, control.focus, control.balance];
    case "cinematic":
      return front
        ? [control.exposure, control.depth, control.format, control.balance]
        : [control.flash, control.exposure, control.depth, control.format, control.balance];
    default:
      return movie
        ? []
        : [
            control.flash,
            control.live,
            control.aspect,
            control.timer,
            control.exposure,
            control.styles,
            control.depth,
            control.night,
            front ? control.framing : control.resolution,
            ...(front ? [] : [control.focus]),
            control.balance,
            control.smart,
          ];
  }
}

export function ControlsPanel({ settings, update }: Props) {
  const profile = useProfile();
  const controls = controlsFor(settings, profile.photoFormat);
  const { display, orientation, mode, expanded } = settings;

  const sheet = arrange(controls.length, {
    display,
    orientation,
    photo: mode === "photo",
    compact: !expanded,
    turned: display === "inner" && (mode === "photo" || (mode === "cinematic" && orientation === "landscape")),
  });

  const narrow = orientation === "landscape" && !sheet.turned;

  return (
    <>
      <div className="tray-backdrop" onClick={() => update({ tray: false })} />
      <section
        className="tray"
        aria-label="Camera controls"
        style={{ left: sheet.left, top: sheet.top, width: sheet.width, height: sheet.height }}
      >
        <div className="tray-stage" style={{ left: `calc(0px - ${sheet.left})`, top: `calc(0px - ${sheet.top})` }}>
          {controls.map(({ label, short, glyph, on }, i) => (
            <button
              key={label}
              className="tray-cell"
              data-on={on || undefined}
              data-turned={sheet.turned || undefined}
              style={{ left: sheet.cells[i]?.x, top: sheet.cells[i]?.y }}
            >
              {glyph}
              <span className="tray-label">{(narrow && short ? short : label).toUpperCase()}</span>
            </button>
          ))}
          <div
            className="tray-handle"
            data-vertical={sheet.handle.vertical || undefined}
            style={{ left: sheet.handle.x, top: sheet.handle.y }}
          />
        </div>
      </section>
    </>
  );
}
