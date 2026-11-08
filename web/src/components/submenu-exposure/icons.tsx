const props = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "#fff",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export const Chevron = () => (
  <svg {...props}>
    <path d="m14.5 5-7 7 7 7" />
  </svg>
);

export const Reset = () => (
  <svg {...props}>
    <path d="M7.6 6.6A7 7 0 1 0 12 5v-2.6M12 5 8.4 2.4" />
  </svg>
);
