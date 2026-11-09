export function Bracket({ ratio }: { ratio: string }) {
  return (
    <svg width="22" height="23" viewBox="0 0 22 23" fill="none" aria-hidden>
      <path
        d="M1.5 6.5v-3a2 2 0 0 1 2-2h3M15.5 1.5h3a2 2 0 0 1 2 2v3M20.5 16.5v3a2 2 0 0 1-2 2h-3M6.5 21.5h-3a2 2 0 0 1-2-2v-3"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <text
        x="11"
        y="15.2"
        textAnchor="middle"
        fill="currentColor"
        fontSize={ratio.length > 3 ? 9.5 : 11}
        fontWeight="500"
        fontFamily="system-ui"
      >
        {ratio}
      </text>
    </svg>
  );
}
