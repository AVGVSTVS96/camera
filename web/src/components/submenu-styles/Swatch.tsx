import { useEffect, useRef } from "react";

export function Swatch({ colors }: { colors: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");

    if (!context) return;

    const pixels = context.createImageData(4, 4);
    colors.split(" ").forEach((hex, i) => {
      const value = Number.parseInt(hex, 16);
      pixels.data.set([value >> 16, (value >> 8) & 255, value & 255, 255], i * 4);
    });

    context.putImageData(pixels, 0, 0);
  }, [colors]);

  return <canvas ref={canvas} className="styles-swatch" width={4} height={4} />;
}
