import { useSlider } from "../../slider.ts";
import { apertureOf, back, type Props } from "../../state.ts";
import { Reset } from "../submenu-exposure/icons.tsx";
import { Submenu } from "../submenu/Submenu.tsx";
import "./submenu-depth.css";

const stops = [
  "1.4",
  "1.6",
  "1.8",
  "2.0",
  "2.2",
  "2.5",
  "2.8",
  "3.2",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
  "5.6",
  "6.3",
  "7.1",
  "8.0",
  "9.0",
  "10",
  "11",
  "13",
  "14",
  "16",
  "18",
  "20",
];

const REACH = 9;
const STOPS_PER_MARK = 3;
const PITCH = 15;

export function SubmenuDepth({ settings, update }: Props) {
  const aperture = apertureOf(settings);
  const { at, home, first, last, off, unavailable } = aperture;
  const marks = Array.from({ length: last - first + 1 }, (_, i) => first + i).filter((i) => Math.abs(i - at) <= REACH);

  const fixed = off || unavailable;

  const slider = useSlider({
    value: at,
    min: fixed ? at : first,
    max: fixed ? at : last,
    pitch: -PITCH,
    settings,
    set: (stop) => update({ stops: { ...settings.stops, [settings.mode]: stop } }),
  });

  return (
    <Submenu title="Depth" className="depth" back={() => update(back)}>
      {at !== home && (
        <button
          className="submenu-button depth-reset"
          aria-label="Reset"
          onClick={() => update({ stops: { ...settings.stops, [settings.mode]: undefined } })}
        >
          <Reset />
        </button>
      )}
      <output className="depth-value">
        {off ? (
          "Off"
        ) : (
          <>
            <sup>ƒ</sup>
            {stops[at]}
          </>
        )}
      </output>
      <div
        className="depth-slider"
        role="slider"
        aria-label="Depth slider"
        aria-valuetext={off ? "Off" : `ƒ${stops[at]}`}
        {...slider}
      >
        {marks.map((i) => (
          <i
            key={i}
            className="depth-tick"
            data-selected={i === at || undefined}
            data-major={i % STOPS_PER_MARK === 0 || undefined}
            style={{ left: 189 + PITCH * (i - at) }}
          />
        ))}
        {at !== home && <i className="depth-home" style={{ left: 187 + PITCH * (home - at) }} />}
      </div>
      {unavailable && <p className="depth-caption">Depth is unavailable.</p>}
    </Submenu>
  );
}
