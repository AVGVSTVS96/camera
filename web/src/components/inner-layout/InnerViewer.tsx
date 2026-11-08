import "./inner-layout.css";

function Ring() {
  return (
    <svg className="inner-ring" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17" stroke="#30d158" strokeWidth="4" />
      <path
        d="M12 18.5a11 11 0 0 1 16 0M15 22a6.5 6.5 0 0 1 10 0"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="26" r="1.6" fill="#000" />
    </svg>
  );
}

export function InnerViewer({ empty }: { empty: boolean }) {
  return (
    <>
      <div className="inner-status">
        <b>9:41</b>
        <Ring />
      </div>
      {empty && (
        <>
          <p className="inner-empty">No Photos or Videos</p>
          <div className="inner-scrubber" aria-label="Video chooser" />
        </>
      )}
    </>
  );
}

export function InnerPreview() {
  return (
    <>
      <p className="inner-preview">Live Preview</p>
      <div className="inner-home" />
    </>
  );
}
