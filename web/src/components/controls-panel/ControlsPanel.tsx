import { useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useProfile } from "../../profile.ts";
import { remember, unseen } from "../../memory.ts";
import { isToggle, toggle, type Props, type Settings, type Submenu, type Toggle } from "../../state.ts";
import { arrange } from "./layout.ts";
import {
  Action,
  Adaptive,
  Aspect,
  Bolt,
  Constant,
  Depth,
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
  name: Submenu | Toggle;
  label: string;
  short?: string;
  glyph: ReactNode;
  on?: boolean;
}

function Stack({ top, bottom, turn = 0 }: { top: string; bottom?: string; turn?: number }) {
  return (
    <span className="badge tray-stack" style={{ rotate: `${turn}deg` }}>
      <b>{top}</b>
      {bottom && <b className="mono">{bottom}</b>}
    </span>
  );
}

function controlsFor(settings: Settings, photoFormat: string, duo: boolean): Control[] {
  const { mode, facing, flash, on, display, orientation, centerStage, formats } = settings;
  const front = facing === "front";
  const nightOff = front || settings.night === "off";
  const movie = mode !== "photo" && mode !== "portrait";
  const turn = orientation === "landscape" ? 90 : display === "inner" ? 180 : 0;
  const [photoName = "", photoDetail = ""] = photoFormat.split(" ");
  const format = formats[mode] ?? { resolution: "HD", rate: 30 };

  const control = {
    flash: { name: "Flash", label: "Flash", glyph: <Bolt flash={flash} /> },
    live: {
      name: "Live Photo",
      label: "Live",
      glyph: <LivePhoto off={duo ? settings.live !== "on" : settings.live === "off"} />,
    },
    aspect: { name: "Aspect Ratio", label: "Aspect", glyph: <Aspect /> },
    timer: { name: "Timer", label: "Timer", glyph: <TimerOff /> },
    exposure: { name: "Exposure", label: "Exposure", glyph: <Exposure /> },
    styles: { name: "Styles", label: "Styles", glyph: <Styles /> },
    depth: { name: "Depth", label: "Depth", glyph: <Depth off={mode === "photo"} /> },
    night: {
      name: "Night Mode",
      label: "Night Mode",
      glyph: duo ? <NightMode off={nightOff} exposure="2" /> : <NightMode off={nightOff} />,
      on: duo && !nightOff,
    },
    resolution: { name: "Resolution", label: "Resolution", glyph: <Stack top={photoName} bottom={photoDetail} /> },
    framing: { name: "Center Stage", label: "Center Stage", glyph: <Framing on={centerStage.zoom} /> },
    focus: { name: "Focus", label: "Focus", glyph: <Focus /> },
    balance: { name: "White Balance", label: "White Balance", short: "AWB", glyph: <WhiteBalance /> },
    smart: { name: "Smart Take", label: "Smart Take", glyph: <SmartTake />, on: duo || on.includes("Smart Take") },
    format: {
      name: "Video Format",
      label: "Format",
      glyph: <Stack top={format.resolution} bottom={String(format.rate)} />,
    },
    action: {
      name: "Action Mode",
      label: "Action",
      glyph: <Action on={on.includes("Action Mode")} />,
      on: on.includes("Action Mode"),
    },
    lapse: {
      name: "Time-Lapse Mode",
      label: "Adaptive",
      glyph: on.includes("Time-Lapse Mode") ? <Adaptive /> : <Constant />,
      on: on.includes("Time-Lapse Mode"),
    },
    quality: { name: "Video Resolution", label: "Resolution", glyph: <Stack top="HD" turn={turn} /> },
  } satisfies Record<string, Control>;

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

interface PanelProps extends Props {
  from?: { x: number; y: number };
  closing: boolean;
  gone: () => void;
}

export function ControlsPanel({ settings, update, from, closing, gone }: PanelProps) {
  const profile = useProfile();
  const controls = controlsFor(settings, profile.photoFormat, profile.name === "duo");
  const { display, orientation, mode, expanded } = settings;
  const [compact, setCompact] = useState(mode === "photo" && !expanded);

  if (!closing && compact !== (mode === "photo" && !expanded)) setCompact(!compact);

  const dismiss = () => update({ tray: false, expanded: false });

  const sheet = arrange(controls.length, {
    display,
    orientation,
    photo: mode === "photo",
    compact,
    turned:
      display === "inner" &&
      (settings.fold !== "half-open" || orientation === "portrait") &&
      (mode === "photo" || (mode === "cinematic" && orientation === "landscape")),
  });

  const narrow = (orientation === "landscape") !== sheet.turned;

  const tray = useRef<HTMLElement>(null);
  const finish = useEffectEvent(gone);

  useLayoutEffect(() => {
    const box = tray.current;
    const menu = document.querySelector<HTMLElement>(".submenu, .styles, .exposure, .focus");

    if (!closing || !box?.offsetParent || !menu) return;

    const turned = orientation === "landscape";
    const [width, height] = turned ? [menu.offsetHeight, menu.offsetWidth] : [menu.offsetWidth, menu.offsetHeight];
    const screen = box.offsetParent.getBoundingClientRect();
    const target = menu.getBoundingClientRect();
    const [x, y] = [target.x + target.width / 2 - screen.x, target.y + target.height / 2 - screen.y];

    const shrink = box.animate(
      [
        {},
        {
          left: `${x - width / 2}px`,
          top: `${y - height / 2}px`,
          width: `${width}px`,
          height: `${height}px`,
          opacity: 0,
        },
      ],
      { delay: 165, duration: 550, easing: "cubic-bezier(0, 0, 0.58, 1)", fill: "both" },
    );

    shrink.finished.then(finish, () => {});

    return () => shrink.cancel();
  }, [closing, orientation]);

  const open = (name: Submenu | Toggle) => {
    if (!isToggle(name)) return update({ submenu: name, tray: false, expanded: false });

    const on = toggle(settings.on, name);

    if (name === "Smart Take" && unseen("smart-take")) {
      remember("smart-take");
      update({ on, tray: false, expanded: false });
    } else update({ on, expanded: true });
  };

  return (
    <>
      <div className="tray-backdrop" data-closing={closing || undefined} onClick={dismiss} />
      <section
        ref={tray}
        className="tray"
        aria-label="Camera controls"
        data-closing={closing || undefined}
        data-handoff={settings.submenu ? true : undefined}
        onAnimationEnd={() => closing && !settings.submenu && gone()}
        style={{
          left: sheet.left,
          top: sheet.top,
          width: sheet.width,
          height: sheet.height,
          transformOrigin: from && `calc(${from.x}px - ${sheet.left}) calc(${from.y}px - ${sheet.top})`,
        }}
      >
        <div className="tray-stage" style={{ left: `calc(0px - ${sheet.left})`, top: `calc(0px - ${sheet.top})` }}>
          {controls.map(({ name, label, short, glyph, on }, i) => (
            <button
              key={label}
              className="tray-cell"
              aria-label={name}
              data-on={on || undefined}
              data-turned={sheet.turned || undefined}
              style={{ left: sheet.cells[i]?.x, top: sheet.cells[i]?.y }}
              onClick={() => open(name)}
            >
              {glyph}
              <span className="tray-label">{(narrow && short ? short : label).toUpperCase()}</span>
            </button>
          ))}
          <button
            className="tray-handle"
            aria-label={compact ? "Expand" : "Dismiss Camera Controls"}
            data-vertical={sheet.handle.vertical || undefined}
            style={{ left: sheet.handle.x, top: sheet.handle.y }}
            onClick={() => (compact ? update({ expanded: true }) : dismiss())}
          />
        </div>
      </section>
    </>
  );
}
