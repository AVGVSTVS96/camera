export function Bracket({ ratio }: { ratio: string }) {
  return (
    <svg width="21" height="21" viewBox="0 0 21 21" fill="none" aria-hidden>
      <path
        d="M.8 5.8v-2a3 3 0 0 1 3-3h2M15.2.8h2a3 3 0 0 1 3 3v2M20.2 15.2v2a3 3 0 0 1-3 3h-2M5.8 20.2h-2a3 3 0 0 1-3-3v-2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <text
        x="10.5"
        y="14"
        textAnchor="middle"
        fill="currentColor"
        fontSize={ratio.length > 3 ? 10 : 11}
        fontWeight="500"
        fontFamily="ui-rounded"
      >
        {ratio}
      </text>
    </svg>
  );
}
