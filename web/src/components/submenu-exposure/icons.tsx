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
    <path d="M12 6a7 7 0 1 1-6.4 3.8M12 6H8.2m2.6-2.4L8.2 6l2.6 2.4" />
  </svg>
);
