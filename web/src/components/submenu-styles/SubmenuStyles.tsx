import { back, type Props } from "../../state.ts";
import { Chevron } from "./icons.tsx";
import { place } from "./styles.ts";
import { Swatch } from "./Swatch.tsx";
import "./submenu-styles.css";

function Scrubber({ selected }: { selected: Props["settings"]["style"] }) {
  return (
    <div className="styles-scrubber">
      {place(selected).map(({ entry, x }, i) =>
        entry.divider ? (
          <span key={i} className="styles-divider" style={{ left: x }} />
        ) : (
          <span key={entry.name} className="styles-cell" style={{ left: x }}>
            <Swatch colors={entry.colors} />
          </span>
        ),
      )}
      <span className="styles-dot" />
    </div>
  );
}

function Pad() {
  return (
    <>
      <div className="styles-tabs">
        <span data-on>PALETTE</span>
        <span>TEXTURE</span>
      </div>
      <div className="styles-pad">
        <span />
      </div>
    </>
  );
}

export function SubmenuStyles({ settings, update }: Props) {
  const { style, customize } = settings;

  return (
    <section className="styles" aria-label="Photographic Styles">
      <div className="styles-header">{!customize && style.toUpperCase()}</div>
      <button className="styles-back" aria-label="Back" onClick={() => update({ ...back, customize: false })}>
        <Chevron />
      </button>
      {customize ? (
        <Pad />
      ) : (
        <>
          <Scrubber selected={style} />
          <button className="styles-customize" onClick={() => update({ customize: true })}>
            CUSTOMIZE
          </button>
        </>
      )}
    </section>
  );
}
