export const More = () => (
  <svg className="glyph" width="20" height="13" viewBox="0 0 20 13" fill="currentColor" aria-hidden>
    {[2.75, 10, 17.25].flatMap((x) => [2.75, 10.25].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="2.75" />))}
  </svg>
);
