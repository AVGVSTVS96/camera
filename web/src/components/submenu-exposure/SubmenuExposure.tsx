import { useSlider } from "../../slider.ts";
import { back, type Props } from "../../state.ts";
import { Chevron, Reset } from "./icons.tsx";
import "./submenu-exposure.css";

const STEPS_PER_STOP = 3;
const VISIBLE = 6;
const PITCH = 20;

const ticks = (selected: number) =>
  Array.from({ length: 2 * VISIBLE + 1 }, (_, i) => {
    const step = i - VISIBLE;

    return { step, selected: step === selected, major: step % STEPS_PER_STOP === 0 };
  });

export function SubmenuExposure({ settings, update }: Props) {
  const { exposure } = settings;
  const selected = Math.round(exposure * STEPS_PER_STOP);

  const slider = useSlider({
    value: selected,
    min: -VISIBLE,
    max: VISIBLE,
    pitch: -PITCH,
    settings,
    set: (step) => update({ exposure: Math.round((step * 10) / STEPS_PER_STOP) / 10 }),
  });

  return (
    <section className="exposure" aria-label="Exposure">
      <div className="exposure-strip">
        <button className="exposure-button" style={{ left: 25 }} aria-label="Back" onClick={() => update(back)}>
          <Chevron />
        </button>
        <h2 className="exposure-header">EXPOSURE</h2>
        {exposure !== 0 && (
          <button
            className="exposure-button exposure-reset"
            style={{ left: 389 }}
            aria-label="Reset"
            onClick={() => update({ exposure: 0 })}
          >
            <Reset />
          </button>
        )}
        <output className="exposure-value">{exposure.toFixed(1)}</output>
        <div
          className="exposure-slider"
          role="slider"
          aria-label="Exposure slider"
          aria-valuenow={exposure}
          {...slider}
        >
          {ticks(selected).map(({ step, selected: on, major }) => (
            <i
              key={step}
              className="exposure-tick"
              data-selected={on || undefined}
              data-major={major || undefined}
              style={{ left: 189 + PITCH * (step - selected) }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
