import { type RefObject, useEffect, useRef, useState } from "react";

const gesture = 100;

/** Follows `target` in a straight line over 0.55 s after 0.04 s, as Apple's label and preview do on a stop tap. Changes that arrive in quick succession (a drag or pinch) and changes of `key` (a mode or camera switch) land at once. */
export function useRamp(target: number, key: string, host: RefObject<Element | null>) {
  const [shown, setShown] = useState(target);
  const now = useRef({ shown, target, key, at: Number.NEGATIVE_INFINITY });

  useEffect(() => {
    const before = now.current;
    const from = before.shown;

    if (before.target === target && before.key === key) return;

    const at = performance.now();
    now.current = { shown: target, target, key, at };

    const settleAt = (value: number) => {
      now.current.shown = value;
      setShown(value);
    };

    if (!host.current || key !== before.key || at - before.at < gesture) return settleAt(target);

    const ramp = host.current.animate(
      { "--ramp": [0, 1] },
      { duration: 550, delay: 40, easing: "linear", fill: "both" },
    );

    let frame = requestAnimationFrame(function step() {
      settleAt(from + (target - from) * (ramp.effect?.getComputedTiming().progress ?? 0));
      frame = requestAnimationFrame(step);
    });

    ramp.finished
      .then(() => {
        cancelAnimationFrame(frame);
        settleAt(target);
      })
      .catch(() => {});

    return () => {
      cancelAnimationFrame(frame);
      ramp.cancel();
    };
  }, [target, key, host]);

  return shown;
}
