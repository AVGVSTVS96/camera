import type { Props } from "../../state.ts";
import { Chevron, Reset } from "./icons.tsx";
import "./submenu-exposure.css";

const STEPS_PER_STOP = 3;
const VISIBLE = 6;

const ticks = (selected: number) =>
  Array.from({ length: 2 * VISIBLE + 1 }, (_, i) => {
    const step = i - VISIBLE;

    return { step, selected: step === selected, major: step % STEPS_PER_STOP === 0 };
  });

export function SubmenuExposure({ settings }: Pick<Props, "settings">) {
  const { exposure } = settings;

  if (exposure === null) return null;

  const selected = Math.round(exposure * STEPS_PER_STOP);

  return (
    <section className="exposure" aria-label="Exposure">
      <button className="exposure-button" style={{ left: 25 }} aria-label="Back">
        <Chevron />
      </button>
      <h2 className="exposure-header">EXPOSURE</h2>
      <button className="exposure-button" style={{ left: 389 }} aria-label="Reset">
        <Reset />
      </button>
      <output className="exposure-value">{exposure.toFixed(1)}</output>
      <div className="exposure-slider" role="slider" aria-label="Exposure slider" aria-valuenow={exposure}>
        {ticks(selected).map(({ step, selected: on, major }) => (
          <i
            key={step}
            className="exposure-tick"
            data-selected={on || undefined}
            data-major={major || undefined}
            style={{ left: 189 + 20 * (step - selected) }}
          />
        ))}
      </div>
    </section>
  );
}
