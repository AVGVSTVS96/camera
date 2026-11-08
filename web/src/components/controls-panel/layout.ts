import type { Display, Orientation } from "../../state.ts";

const COLUMN = 136.67;
const ROW = 124;
const COMPACT = 97.67;

export interface Cell {
  index: number;
  x: string;
  y: string;
}

export interface Sheet {
  cells: Cell[];
  left: string;
  top: string;
  width: string;
  height: string;
  handle: { x: string; y: string; vertical: boolean };
  turned: boolean;
}

interface Options {
  display: Display;
  orientation: Orientation;
  photo: boolean;
  compact: boolean;
}

const px = (base: string, offset: number) => `calc(${base} + ${offset}px)`;
const W = "var(--w)";
const H = "var(--h)";
const midW = `${W} / 2`;
const midH = `${H} / 2`;

export function arrange(count: number, { display, orientation, photo, compact }: Options): Sheet {
  const rows = Math.ceil(count / 3);
  const shift = photo && compact ? COMPACT : 0;

  const slot = (index: number) => {
    const row = Math.floor(index / 3);

    return { row, column: row === rows - 1 && count % 3 === 1 ? 1 : index % 3 };
  };

  if (orientation === "landscape") {
    const turned = display === "inner" && photo;
    const line = (row: number) => 115 + ROW * (rows - 1 - row) - shift;
    const handleX = line(0) + 70;

    return {
      cells: Array.from({ length: count }, (_, index) => {
        const { row, column } = slot(index);

        return { index, x: `${line(row)}px`, y: px(midH, (column - 1) * COLUMN - (turned ? 0 : 17)) };
      }),
      left: "8px",
      top: px(midH, -225),
      width: `${handleX + 6}px`,
      height: "450px",
      handle: { x: `${handleX}px`, y: px(midH, -19), vertical: true },
      turned,
    };
  }

  if (display === "outer") {
    const rowTop = (row: number) => px(H, -149 - ROW * (rows - 1 - row) + shift);
    const handleTop = px(H, -149 - ROW * (rows - 1) + shift - 50);

    return {
      cells: Array.from({ length: count }, (_, index) => {
        const { row, column } = slot(index);

        return { index, x: px(midW, (column - 1) * COLUMN), y: `calc(${rowTop(row)} + 34px)` };
      }),
      left: "8px",
      top: handleTop,
      width: px(W, -16),
      height: px(H, -8 + 149 + ROW * (rows - 1) - shift + 50),
      handle: { x: px(midW, -19), y: px(handleTop, 10), vertical: false },
      turned: false,
    };
  }

  const first = photo ? 57 : 47;
  const handleTop = first - shift + ROW * (rows - 1) + (photo ? 128 : 138);

  return {
    cells: Array.from({ length: count }, (_, index) => {
      const { row, column } = slot(index);

      return { index, x: px(midW, (1 - column) * COLUMN), y: `${first - shift + ROW * (rows - 1 - row) + 34}px` };
    }),
    left: px(midW, -225),
    top: "8px",
    width: "450px",
    height: `${handleTop + 6}px`,
    handle: { x: px(midW, -19), y: `${handleTop}px`, vertical: false },
    turned: false,
  };
}
