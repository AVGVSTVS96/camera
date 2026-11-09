export function Status() {
  return (
    <div className="viewer-status" aria-hidden="true">
      <span className="viewer-clock">9:41</span>
      <svg className="viewer-ring" width="43" height="46" viewBox="0 0 43 46" fill="none">
        <g transform="matrix(1.08 0 0 1.1 -0.4 1.9)">
          <path d="M6.3 29.7A16.8 16.8 0 1 1 36 29.7" stroke="#34c759" strokeWidth="2.8" strokeLinecap="round" />
          <path
            d="M22.2 1.2 18.8 7h2.7l-1 4.6 3.8-6.2h-2.6z"
            fill="#8e8e93"
            stroke="#fff"
            strokeWidth="2.4"
            paintOrder="stroke"
            strokeLinejoin="round"
          />
          <g stroke="#000" strokeWidth="2.8" strokeLinecap="round">
            <path d="M14.6 18.8Q21.1 12.8 27.6 18.8" />
            <path d="M17.2 22.4Q21.1 18.9 25 22.4" />
          </g>
          <path d="M21.1 26.7 19 24.4Q21.1 23.2 23.2 24.4z" fill="#000" />
          <g fill="#000">
            <circle cx="12.3" cy="35.5" r="1.9" />
            <circle cx="18.1" cy="37.4" r="1.9" />
            <circle cx="23.9" cy="37.4" r="1.9" />
            <circle cx="29.4" cy="35.5" r="1.9" />
          </g>
        </g>
      </svg>
    </div>
  );
}
