import type { ReactNode } from "react";

const Arrows = ({ children }: { children: ReactNode }) => (
  <>
    {children}
    <g transform="rotate(180)">{children}</g>
  </>
);

export const LandscapeGlyph = () => (
  <svg className="aspect-flip-glyph" viewBox="-12 -12 24 24" aria-hidden>
    <rect x="-5.9" y="-4.4" width="11.8" height="8.8" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="0.2" cy="-1.5" r="1.7" />
    <path d="M-3.5 4.4C-3.5 2.6-2 1.7 0 1.7S3.5 2.6 3.5 4.4Z" />
    <Arrows>
      <path
        d="M9.7-4.2C9.5-7 7.5-8.5 4.8-8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M3.4-8.5 6.5-10.5V-6.5Z" />
    </Arrows>
  </svg>
);

export const PortraitGlyph = () => (
  <svg className="aspect-flip-glyph" viewBox="-12 -12 24 24" aria-hidden>
    <rect x="-4.4" y="-5.6" width="8.8" height="12" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.2" />
    <circle cx="0" cy="-0.9" r="2.1" />
    <path d="M-3.6 6.4C-3.6 4 -2 2.4 0 2.4S3.6 4 3.6 6.4Z" />
    <Arrows>
      <path d="M8-5.4C7.9-8 6-9.6 3.8-9.6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M1.9-9.6 4.6-11.5V-7.7Z" />
    </Arrows>
  </svg>
);
