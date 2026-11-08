import { bolt, Icon } from "../../icons.tsx";

export const BoltSlash = () => (
  <Icon>
    <path d={bolt} fill="currentColor" stroke="none" transform="translate(1.2 1) scale(.9)" />
    <path d="M4 3.5 20 20.5" stroke="#000" strokeWidth={3.4} />
    <path d="M4 3.5 20 20.5" />
  </Icon>
);

export const RunSlash = () => (
  <Icon>
    <circle cx="14.5" cy="4.2" r="1.8" fill="currentColor" stroke="none" />
    <path d="m6.5 10 3.5-3h4l2 4 3 1M10 7l-1.5 6 4 3-1 5M8.5 13l-2 3.5H3" strokeWidth={1.9} />
    <path d="M3.5 3.5 20.5 20.5" stroke="#000" strokeWidth={3.4} />
    <path d="M3.5 3.5 20.5 20.5" />
  </Icon>
);

export const Plus = () => (
  <Icon size={20}>
    <path d="M12 5v14M5 12h14" strokeWidth={1.8} />
  </Icon>
);
