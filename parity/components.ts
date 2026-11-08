import type { State } from "./states.ts";
import { clip, pad, placed, walk, type Ax, type Rect, type Tree, type View } from "./tree.ts";

export interface Component {
  name: string;
  about: string;
  when?: (state: State) => boolean;
  view?: (view: View, parent?: View) => boolean;
  ax?: (element: Ax, state: State) => boolean;
  screen?: boolean;
}

const classes =
  (...names: string[]) =>
  (view: View) =>
    names.includes(view.class);

const ids =
  (pattern: RegExp) =>
  ({ identifier }: Ax) =>
    pattern.test(identifier ?? "");

const shutter = /Capture$/;
const bottomRow = /^(GoToCameraRoll|FlipButton|ControlPanelToggleButton|DepthEffectSuggestion|Camera Mode)$/;
const recording = /^(TakeStillPictureButton|PauseResumeButton-.*)$/;

const notBadges = new Set(["FlipAspectRatioButton", "BackButton", "TakeStillPictureButton"]);

const badge = ({ identifier = "", frame }: Ax) =>
  identifier === "minus" ||
  (identifier.endsWith("Button") && !notBadges.has(identifier) && (frame.w ?? 0) <= 44 && (frame.h ?? 0) <= 44);

const viewfinderParts = new Set(["CAMPreviewView", "CAMZoomControl", "CAMElapsedTimeView", "CEKLightingControl"]);

function panelPart(element: Ax, state: State) {
  const { identifier = "", frame } = element;

  return (
    !viewfinderParts.has(element.class) &&
    !shutter.test(identifier) &&
    !bottomRow.test(identifier) &&
    !recording.test(identifier) &&
    identifier !== "FlipAspectRatioButton" &&
    !badge(element) &&
    (frame.w ?? 0) * (frame.h ?? 0) < 0.4 * state.screen.widthPt * state.screen.heightPt
  );
}

const panel = (state: State) => String(state.controls?.panel ?? "");

const submenuControls = [
  "Flash",
  "Live Photo",
  "Aspect Ratio",
  "Timer",
  "Exposure",
  "Styles",
  "Depth",
  "Night Mode",
  "Resolution",
  "Focus",
  "White Balance",
  "Video Format",
  "Video Resolution",
  "Center Stage",
];

const slug = (text: string) => text.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");

export const components: Component[] = [
  {
    name: "shutter",
    about: "Shutter and record button (CAMDynamicShutterControl, its liquid shutter and the time-lapse ring).",
    view: (view, parent) =>
      view.class === "CAMTimelapseShutterRingView" || (parent?.class === "CameraUI.CAMLiquidShutterView" && !!view.bg),
    ax: ids(shutter),
  },
  {
    name: "zoom",
    about: "Zoom stops platter (CAMZoomButtonPlatter, CAMZoomButton, CAMZoomFactorLabel).",
    view: classes("CAMZoomButtonPlatter"),
  },
  { name: "mode-dial", about: "Mode dial under the shutter (SwiftUI, AX 'Camera Mode').", ax: ids(/^Camera Mode$/) },
  {
    name: "thumbnail",
    about: "Last-capture thumbnail that opens the viewer (AX GoToCameraRoll).",
    ax: ids(/^GoToCameraRoll$/),
  },
  { name: "flip", about: "Front/back camera switch (AX FlipButton).", ax: ids(/^FlipButton$/) },
  {
    name: "controls-button",
    about: "Button that opens the controls panel (AX ControlPanelToggleButton).",
    ax: ids(/^ControlPanelToggleButton$/),
  },
  {
    name: "depth-button",
    about: "Depth (ƒ) suggestion button beside the shutter in Photo (AX DepthEffectSuggestion).",
    ax: ids(/^DepthEffectSuggestion$/),
  },
  {
    name: "smart-take",
    about: "Smart Take button beside the shutter (iOS 27.2; the 27.1 simulator shows it only once Smart Take is on).",
    ax: (element) =>
      /^(PersonalPhotographerButton|AutoCaptureButton)$/.test(element.identifier ?? "") && badge(element),
  },
  {
    name: "macro",
    about: "Macro button bottom-left in Video (iOS 27.2 only; the simulator has no macro capability).",
    ax: ids(/Macro/),
  },
  {
    name: "top-bar",
    about:
      "Indicator row across the top: Flash, Live, Night, format (CAMBadgeTray). Off-screen in the 27.1 simulator, so only the Duo references judge it.",
    view: classes("CAMBadgeTray"),
    ax: badge,
  },
  {
    name: "aspect-flip",
    about: "Inner-display button that flips the window between portrait and landscape (CAMFlipAspectRatioButton).",
    view: classes("CAMFlipAspectRatioButton"),
    ax: ids(/^FlipAspectRatioButton$/),
  },
  {
    name: "controls-panel",
    about: "Controls panel grid, compact and expanded (SwiftUI sheet of control buttons).",
    when: (state) => ["open", "expanded"].includes(panel(state)),
    ax: panelPart,
  },
  ...submenuControls.map((control): Component => ({
    name: `submenu-${slug(control)}`,
    about: `${control} submenu of the controls panel: header, Back, options and sliders.`,
    when: (state) => ["submenu", "styles customize"].includes(panel(state)) && state.controls?.control === control,
    view: classes("CAMExposureSlider", "CEKApertureSlider", "CAMFilterScrubberView"),
    ax: panelPart,
  })),
  {
    name: "lighting",
    about: "Portrait Lighting dial and its name badge (CEKLightingControl, CEKLightingNameBadge).",
    view: classes("CEKLightingControl", "CEKLightingNameBadge", "CEKMultiplyImageView"),
  },
  {
    name: "focus",
    about: "Focus square, AE/AF lock badge and exposure bias slider (CAMFocusIndicatorView, CAMFocusLockBadge).",
    view: classes("CAMFocusIndicatorView", "CAMFocusLockBadge", "CAMExposureBiasSlider"),
  },
  {
    name: "recording",
    about: "Recording timer, pause and still-capture buttons while recording (CAMElapsedTimeView).",
    view: classes("CAMElapsedTimeView"),
    ax: ids(recording),
  },
  { name: "countdown", about: "Self-timer countdown (CAMTimerIndicatorView).", view: classes("CAMTimerIndicatorView") },
  { name: "grid", about: "Grid lines over the viewfinder (CAMGridView).", view: classes("CAMGridView") },
  {
    name: "sheets",
    about: "First-run and description sheets: Cinematic intro, Photographic Styles onboarding and Choose a Style.",
    when: (state) => !!state.controls?.sheet,
    view: classes(
      "CAMPortraitModeDescriptionOverlayPrimaryVibrancyEffectView",
      "CAMCinematicDescriptionOverlayView",
      "CAMPhotographicStylesDescriptionOverlayView",
      "CAMSmartStylePreviewGridView",
    ),
    ax: ids(/^PhotographicStyles\.Setup/),
  },
  {
    name: "viewer",
    about: "Photo viewer opened from the thumbnail (the simulator's library is empty).",
    when: (state) => state.mode === "viewer",
    screen: true,
  },
  {
    name: "access",
    about: "Camera-denied screen.",
    when: (state) => state.controls?.permission === "camera denied",
    screen: true,
  },
  {
    name: "inner-layout",
    about: "Everything on the inner display at once: how the chrome is arranged on the big panel.",
    when: (state) => state.display === "inner",
    screen: true,
  },
];

const opaque = (color?: string) => !!color && !color.endsWith("/0.000");

const drawn = new Set(["UIVisualEffectView", "CAMGridView", "CEKDynamicTickMarksView", "CAMTimelapseShutterRingView"]);

const paints = (view: View) => !!view.text || !!view.image || opaque(view.bg) || drawn.has(view.class);

export interface Found {
  views: View[];
  ax: Ax[];
  regions: Rect[];
}

const regionPad = 4;

export function find(component: Component, state: State, { views, ax }: Tree): Found | undefined {
  if (component.when && !component.when(state)) return;

  const screen = { x: 0, y: 0, w: state.screen.widthPt, h: state.screen.heightPt };

  if (component.screen) return { views: [], ax: [], regions: [screen] };

  const roots: View[] = [];
  const inside = new Set<View>();

  for (const [view, parent] of walk(views)) {
    if (parent && inside.has(parent)) inside.add(view);
    else if (component.view?.(view, parent)) {
      roots.push(view);
      inside.add(view);
    }
  }

  const match = component.ax;
  const elements = match ? ax.filter((e) => match(e, state)) : [];
  const painted = roots.flatMap((root) => [...walk([root])].flatMap(([v]) => (paints(v) ? [v.frame] : [])));
  const rects = [...painted, ...elements.flatMap((e) => (placed(e.frame) ? [e.frame] : []))];
  const regions = rects.flatMap((r) => clip(pad(r, regionPad), state) ?? []);

  return roots.length || elements.length ? { views: roots, ax: elements, regions } : undefined;
}
