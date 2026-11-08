import type { State } from "./states.ts";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface View {
  class: string;
  frame: Rect;
  subviews?: View[];
  alpha?: number;
  bg?: string;
  cornerRadius?: number;
  font?: string;
  text?: string;
  textColor?: string;
  image?: string;
  tint?: string;
  transform?: string;
  id?: string;
  ax?: string;
  title?: string;
  selected?: boolean;
  enabled?: boolean;
}

export interface Ax {
  class: string;
  frame: Partial<Rect>;
  identifier?: string;
  label?: string;
  value?: string;
  traits: string[];
}

export interface Tree {
  views: View[];
  ax: Ax[];
}

export async function tree(state: State): Promise<Tree> {
  if (!state.views) return { views: [], ax: [] };

  const views: View[] = await Bun.file(state.views).json();
  const ax: { windows: { elements: Ax[] }[] } = state.ax ? await Bun.file(state.ax).json() : { windows: [] };

  return { views, ax: ax.windows.flatMap((w) => w.elements) };
}

export const visible = (view: View) => (view.alpha ?? 1) > 0.01;

export function* walk(views: View[], parent?: View): Generator<[View, View | undefined]> {
  for (const view of views) {
    if (!visible(view)) continue;
    yield [view, parent];
    yield* walk(view.subviews ?? [], view);
  }
}

export const placed = (frame: Partial<Rect>): frame is Rect =>
  frame.x != null && frame.y != null && frame.w != null && frame.h != null;

export function clip(rect: Rect, state: State): Rect | undefined {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const w = Math.min(state.screen.widthPt, rect.x + rect.w) - x;
  const h = Math.min(state.screen.heightPt, rect.y + rect.h) - y;

  return w > 0.5 && h > 0.5 ? { x, y, w, h } : undefined;
}

export const pad = (rect: Rect, by: number): Rect => ({
  x: rect.x - by,
  y: rect.y - by,
  w: rect.w + 2 * by,
  h: rect.h + 2 * by,
});
