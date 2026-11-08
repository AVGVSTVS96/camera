import { Icon } from "../../icons.tsx";

const hook = "M5.3 7V9.5C5.3 11.1 6.4 11.8 8.3 12H16.3C17.5 12.1 18.2 12.9 18.2 14.2V16.7";

export const DepthOff = () => (
  <Icon>
    <path d={`${hook}M12.3 7.8V16.5`} />
  </Icon>
);

export const DepthOn = () => (
  <Icon>
    <path d="M5.3 7V9.5C5.3 11.1 6.4 11.8 8.3 12H10.7M12.3 7.8V10M12.3 14.2V16.6M14.2 12.7H16.3C17.5 12.9 18.2 13.4 18.2 14.4V16.7M5.7 18.7 18.2 6.2" />
  </Icon>
);
