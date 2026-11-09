import { back, type Props } from "../../state.ts";
import { Chevron, Mountains, Person } from "./icons.tsx";
import "./submenu-focus.css";

const dots = [
  73, 78.67, 85.33, 93.33, 102.67, 112.67, 124.33, 137, 150.67, 165.33, 181.33, 198.67, 216.83, 236.33, 256.83, 278.67,
  301.33, 325.33, 350.67, 376.83,
];

const stopsPerUnit = 40;

export function SubmenuFocus({ settings, update }: Props) {
  const { value, auto } = settings.focus;
  const stop = Math.min(Math.round(value * stopsPerUnit), dots.length - 1);

  return (
    <section className="focus" aria-label="Focus">
      <button className="focus-back" aria-label="Back" onClick={() => update(back)}>
        <Chevron />
      </button>
      <span className="focus-title">FOCUS</span>
      <button
        className="focus-auto"
        aria-label="Auto"
        data-on={auto || undefined}
        onClick={() => update({ focus: { value, auto: true } })}
      >
        A
      </button>
      <span className="focus-person">
        <Person />
      </span>
      <span className="focus-mountains">
        <Mountains />
      </span>
      <div className="focus-track" role="slider" aria-label="Focus" aria-valuenow={value}>
        {dots.map((x) => (
          <i key={x} className="focus-dot" style={{ left: x }} />
        ))}
        <i className="focus-thumb" data-on={!auto || undefined} style={{ left: dots[stop] }} />
      </div>
    </section>
  );
}
