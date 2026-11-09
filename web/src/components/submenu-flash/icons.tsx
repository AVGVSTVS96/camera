import { bolt, Icon } from "../../icons.tsx";

const centered = "translate(12 12) scale(.92) translate(-11.75 -12)";

const Bolt = () => <path d={bolt} fill="currentColor" strokeWidth={1.2} transform={centered} />;

export const Automatic = () => (
  <Icon size={30}>
    <Bolt />
    <circle cx="17.2" cy="16.6" r="4.7" fill="currentColor" stroke="#1f1f1f" strokeWidth={1.6} paintOrder="stroke" />
    <path d="m15.4 19 1.8-4.6 1.8 4.6m-3-1.5h2.4" stroke="#1f1f1f" strokeWidth={1.1} />
  </Icon>
);

export const On = () => (
  <Icon size={30}>
    <Bolt />
  </Icon>
);

export const Off = () => (
  <Icon size={30}>
    <Bolt />
    <path d="M4.9 5.3 19.1 18.7" stroke="#1f1f1f" strokeWidth={3.4} />
    <path d="M4.9 5.3 19.1 18.7" strokeWidth={1.3} />
  </Icon>
);
