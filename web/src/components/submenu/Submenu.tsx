import type { ReactNode } from "react";
import "./submenu.css";

function Chevron() {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7.7 1.75 1.7 8l6 6.25" />
    </svg>
  );
}

export function Submenu({
  title,
  className,
  back,
  auto,
  children,
}: {
  title: string;
  className: string;
  back: () => void;
  auto?: { on: boolean; select: () => void };
  children: ReactNode;
}) {
  return (
    <section className={`submenu ${className}`} aria-label={title}>
      <button className="submenu-button submenu-back" aria-label="Back" onClick={back}>
        <Chevron />
      </button>
      <h2 className="submenu-title">{title.toUpperCase()}</h2>
      {auto && (
        <button
          className="submenu-button submenu-auto"
          data-on={auto.on || undefined}
          aria-label="Auto"
          onClick={auto.select}
        >
          A
        </button>
      )}
      {children}
    </section>
  );
}
