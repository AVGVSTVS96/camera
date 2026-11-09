import type { Sheet as Kind, Update } from "../../state.ts";
import "./sheets.css";

const text = {
  intro: {
    title: "Cinematic Video",
    body: [
      "Add beautiful shallow depth of field and focus transitions to your videos automatically.",
      "Your video depth information is stored and allows you to later change the depth of field effect.",
    ],
    action: "Continue",
  },
  styles: {
    title: "Photographic Styles",
    body: [
      "Customize how your iPhone captures color, skin tone, texture, mood, and more to get just the look you want. Photographic Styles can be adjusted in Camera or when editing in Photos.",
    ],
    action: "Choose Style",
  },
} as const;

const thumbs = ["standard", "warm", "amber", "tan"];

function Choose({ update }: { update: Update }) {
  return (
    <div className="sheet choose" data-sheet="choose">
      <h2>Choose a Style</h2>
      <p>Swipe to select a Photographic Style, or customize the color, tone, and texture.</p>
      <div className="sheet-grid">
        {thumbs.map((t) => (
          <i key={t} />
        ))}
      </div>
      <b className="sheet-name">STANDARD</b>
      <u className="sheet-dot" />
      <div className="sheet-strip">
        {thumbs.map((t, i) => (
          <i key={t} data-style={t} data-selected={i === 0 || undefined} />
        ))}
        <s />
      </div>
      <button className="sheet-set">Set Style</button>
      <button className="sheet-custom">Customize</button>
      <button className="sheet-close" aria-label="Close" onClick={() => update({ sheet: undefined })}>
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="m3 3 16 16M19 3 3 19" />
        </svg>
      </button>
    </div>
  );
}

export function Sheet({ kind, update }: { kind: Kind; update: Update }) {
  if (kind === "choose") return <Choose update={update} />;

  const { title, body, action } = text[kind];
  const close = () => update({ sheet: undefined });

  return (
    <div className="sheet" data-sheet={kind}>
      <h2>{title}</h2>
      {body.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <button className="sheet-action" onClick={kind === "styles" ? () => update({ sheet: "choose" }) : close}>
        {action}
      </button>
      {kind === "styles" && (
        <button className="sheet-later" onClick={close}>
          Not Now
        </button>
      )}
    </div>
  );
}
