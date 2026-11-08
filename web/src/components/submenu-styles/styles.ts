export type StyleName = "standard" | "gold" | "natural";

export type Entry = { divider: true } | { divider?: false; name: string; colors: string };

const DIVIDER: Entry = { divider: true };

const style = (label: string, colors: string): Entry => ({ name: label.toLowerCase(), colors });

export const strip: Entry[] = [
  style("Cool Rose", "c9b4c0 e0b4c4 d8a0b8 8a7e86 8f7480 8a6272 4a4248 4f3d47 4b3340"),
  style("Neutral", "575450 afa4a1 aaa9bb 43413f 797270 7c7a8b 2d2c2b 443f3e 43424d"),
  style("Bright", "e7b9be f5d2cb e2d7ca b57675 b78b85 bba19b 643b4a 653a4f 653d4d"),
  style("Rose Gold", "c4b6a9 d8b7a0 d4aa9b 8c847b 917d6b 977a67 4b453f 504336 514131"),
  style("Gold", "c5ad8b d8a654 d29d34 8d806f 90744d 946f34 4d4337 4f412e 4f3e25"),
  style("Amber", "c5ada0 daa787 d4a079 8e7f78 947362 977057 4e423e 553e34 553b2e"),
  DIVIDER,
  style("Standard", "b3b7bb adbac2 9dadb8 828587 778086 707e88 444547 414649 3b454c"),
  DIVIDER,
  style("Vibrant", "abb1ac b4998e c06a67 778686 6a7b76 78675e 39494b 314a4b 304644"),
  style("Natural", "bcbec1 bdc3d0 a8b1c8 868789 80848d 787f93 464647 44464b 3f4452"),
  style("Luminous", "aeb4bd a4a1ba ab8b99 7e8788 657c87 686d88 404847 324a4a 2e4550"),
  style("Dramatic", "acb9b8 6db6c3 35a6c7 888683 737c74 517b7c 494644 4f4137 484032"),
  style("Quiet", "c1bcaf bdac92 b0a07e 878880 7d7968 726e58 434843 414439 3c3d30"),
  style("Cozy", "d9c0a0 e3b88a e8a870 8a7b66 8c6f52 8a5f3c 463d33 4a382a 4a3224"),
];

const CELL = 58;
const DIVIDER_CELL = 30;
const SELECTED_X = 196;

export function place(selected: StyleName) {
  const starts: number[] = [];
  let x = 0;

  for (const entry of strip) {
    starts.push(x);
    x += entry.divider ? DIVIDER_CELL : CELL;
  }

  const anchor = starts[strip.findIndex((entry) => !entry.divider && entry.name === selected)] ?? 0;

  return strip.map((entry, i) => ({ entry, x: SELECTED_X + (starts[i] ?? 0) - anchor }));
}
