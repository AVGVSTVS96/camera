export const More = () => (
  <svg width="17" height="10.5" viewBox="0 0 17 10.5" fill="#fff" aria-hidden>
    {[2, 8.5, 15].flatMap((x) => [2, 8.5].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2" />))}
  </svg>
);
