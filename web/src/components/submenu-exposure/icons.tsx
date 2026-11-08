const props = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "#fff",
  strokeWidth: 1.7,
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
    <path d="M5.4 13.6a6.6 6.6 0 1 0 6.6-6.6H8.6M12.2 3.8 8.6 7.3l3.6 3.6" />
  </svg>
);
