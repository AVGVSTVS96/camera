import type { ReactNode } from "react";

function Ring({ children }: { children: ReactNode }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const Off = () => (
  <Ring>
    <circle cx="12.5" cy="12.5" r="10.5" />
    <path d="M4.500 4.500l16 16" />
  </Ring>
);

export const Seconds = ({ value }: { value: number }) => (
  <Ring>
    <path d="M12.500 2a10.500 10.500 0 1 1-10.500 10.500c0-2.500.9-4.700 2.400-6.400M9.500 3.200l3-1.200-1 3.200" />
    <text
      x="12.500"
      y="17"
      textAnchor="middle"
      fill="currentColor"
      stroke="none"
      fontSize={value > 9 ? 11 : 13.500}
      fontWeight="500"
    >
      {value}
    </text>
  </Ring>
);
