import type { ReactNode } from "react";

function Ring({ children }: { children: ReactNode }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.900"
      strokeLinecap="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const Off = () => (
  <Ring>
    <path d="M12.500 2A10.500 10.500 0 0 1 21.600 17.750M3.400 7.250A10.500 10.500 0 0 0 12.500 23v-2.500M3 2.500l20 20" />
  </Ring>
);

export const Seconds = ({ value }: { value: number }) => (
  <Ring>
    <path d="M13.500 2.550A10 10 0 1 1 5.100 5.500M13.500 1.500v3.500" />
    <text
      x="12.500"
      y="17"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize={value > 9 ? 12.5 : 15}
      fontWeight="500"
      letterSpacing="-0.5"
      style={{ fontVariantNumeric: "slashed-zero" }}
    >
      {value}
    </text>
  </Ring>
);
