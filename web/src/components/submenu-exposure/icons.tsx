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
    <path d="M12 6.5a6.2 6.2 0 1 1-5.7 3.4M12 6.5H8.6m2.2-2.2L8.6 6.5l2.2 2.2" />
  </svg>
);
