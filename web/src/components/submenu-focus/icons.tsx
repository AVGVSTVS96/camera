export function Chevron() {
  return (
    <svg
      width="9"
      height="15"
      viewBox="0 0 9 15"
      fill="none"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.8 1.2 1.5 7.5l6.3 6.3" />
    </svg>
  );
}

export function Person() {
  return (
    <svg width="22" height="22" viewBox="0 0 66 66" fill="#a5a5a5">
      <ellipse cx="34.6" cy="18.6" rx="12.9" ry="13.8" />
      <path d="M7.5 58a27.1 19 0 0 1 54.2 0v.8a4 4 0 0 1-4 4H11.5a4 4 0 0 1-4-4z" />
    </svg>
  );
}

const peak = "M73.8 12.5 107.4 56.6H40.7z";

export function Mountains() {
  return (
    <svg
      width="40"
      height="22"
      viewBox="0 0 120 66"
      fill="#a5a5a5"
      stroke="#a5a5a5"
      strokeWidth="13"
      strokeLinejoin="round"
    >
      <mask id="focus-mountains" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="66">
        <rect width="120" height="66" fill="#fff" stroke="none" />
        <path d={peak} fill="#000" stroke="#000" strokeWidth="22" />
        <path d={peak} fill="#fff" stroke="#fff" />
        <path
          d="M48 29.5c9 0 11 4 15.4 4s6.1-4.9 10.6-4.9 6.5 4.9 10.9 4.9 6.1-4 15.1-4M10 38.5c8 0 9.5 2.8 13.5 2.8s5.5-3.8 9.5-3.8 5 3.8 8 3.8"
          fill="none"
          stroke="#000"
          strokeWidth="3.7"
        />
      </mask>
      <g mask="url(#focus-mountains)">
        <path d="M32.8 26.4 56.6 56.6H8.5z" />
        <path d={peak} />
      </g>
    </svg>
  );
}
