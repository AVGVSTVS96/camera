import { flushSync } from "react-dom";

const still = ".viewfinder, .dial";
const looks = ["width", "height", "backgroundColor", "boxShadow", "color"] as const;

/** Markup that didn't change can still look different when the screen's attributes restyle it. */
function alike(before: Element, after: Element) {
  const [was, is] = [getComputedStyle(before), getComputedStyle(after)];

  return (
    before.tagName === after.tagName && !after.getAnimations().length && looks.every((look) => was[look] === is[look])
  );
}

/** Walks the old copy beside the live screen: parts that look the same leave the copy, the rest fade out of it and into the screen. */
function fade(old: Element, now: Element, timing: KeyframeAnimationOptions, fades: Animation[]) {
  const parts = [...old.children];

  for (let i = 0; i < Math.max(parts.length, now.children.length); i++) {
    const [before, after] = [parts[i], now.children[i]];

    const same = before && after && alike(before, after);

    if (before?.matches(still) || (same && before.outerHTML === after.outerHTML)) before.remove();
    else if (same && before.children.length && after.children.length) fade(before, after, timing, fades);
    else {
      if (before) fades.push(before.animate({ opacity: [1, 0] }, { ...timing, fill: "both" }));

      if (after) fades.push(after.animate({ opacity: [0, 1] }, { ...timing, fill: "backwards" }));
    }
  }
}

/**
 * Applies a change with the controls it changes cross-fading: the old ones fade out on a copy of the screen that
 * nothing can tap, so the live app stays tappable, unlike a View Transition, which covers the page.
 */
export function crossfade(apply: () => void, timing: KeyframeAnimationOptions) {
  const screen = document.querySelector(".screen");

  if (!screen) return apply();

  // SAFETY: cloning an element yields an element of the same kind.
  const ghost = screen.cloneNode(true) as HTMLElement;
  ghost.classList.add("ghost");
  ghost.inert = true;
  ghost.ariaHidden = "true";
  screen.after(ghost);
  flushSync(apply);

  const fades: Animation[] = [];

  fade(ghost, screen, timing, fades);
  Promise.allSettled(fades.map((one) => one.finished)).then(() => ghost.remove());
}
