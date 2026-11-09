export type Entry = { divider: true } | { divider?: false; name: string; colors: string };

const DIVIDER: Entry = { divider: true };

const style = (label: string, colors: string): Entry => ({ name: label.toLowerCase(), colors });

export const strip: Entry[] = [
  style(
    "Cool Rose",
    "c7b9c6 d8b4c8 dfa8c0 e0a0b8 9a8792 a07c8c a4707f a8687a 6c5a64 70535f 744c5a 774654 40353c 43303a 452c36 462833",
  ),
  style(
    "Neutral",
    "514e4b 9b9188 c7bcc0 b7b7d0 42413f 79716c 999194 8d8da3 353434 59544f 6e666a 656578 282726 373533 403c3d 3a3b4a",
  ),
  style(
    "Bright",
    "f7ced7 f9d5d3 fbdfd5 f2e9dc d68a8c d89b94 d4b5a8 d2c7bc 945c5e 946263 987371 a1787b 5d3547 5b304d 592e4b 5a3043",
  ),
  style(
    "Rose Gold",
    "d7cbbe ddc0a7 e4bda8 eabaad a29b94 a79481 ab907c b18f7c 736d68 76695b 7a6654 7d6552 433d38 443c34 493a2b 4a3a2a",
  ),
  style(
    "Gold",
    "d9c2a3 deae65 e3ac45 e8ad2f a49787 a68a63 a98246 ad8232 766b60 75644e 78603d 7a5c2f 463b30 473b2b 473926 483722",
  ),
  style(
    "Amber",
    "d8c2b6 dfaf91 e6ae87 eab083 a59791 a88877 ac836b b08364 766b67 7a6157 7d5d4d 7e5b46 463b38 493933 4f352a 4e3528",
  ),
  DIVIDER,
  style(
    "Standard",
    "c8cccf b7c2c9 b0bfca aabdc9 9a9c9e 8f979b 87939c 82939d 6d6e70 666a6f 616b71 5b6a72 3c3e40 3b3d3f 373e43 333e45",
  ),
  DIVIDER,
  style(
    "Vibrant",
    "bfc8c3 b6ac9f c68e82 da6467 919d9e 80908b 887f76 986960 647072 556e6d 506965 5b5f55 324244 2d4246 294344 274141",
  ),
  style(
    "Natural",
    "d1d3d5 c8cdd5 c1c8da b5bfdb 9fa0a0 989ba1 9297a8 8a93ab 6e6f70 6b6c72 676c78 626a7d 3e3f40 3d3f41 3a3e45 373d4c",
  ),
  style(
    "Luminous",
    "c6cdd3 aaacc7 b29db8 c3949c 9aa0a1 7d919e 79849a 857691 6d7270 576e6f 4d6773 4d607d 39403f 304340 284243 27404a",
  ),
  style(
    "Dramatic",
    "c7cfcd 86bfc6 51bbd6 25b4e2 a09f9d 89948d 679091 468e9b 73716f 71675f 666558 4d6860 413f3d 443b36 4a382b 47382a",
  ),
  style(
    "Quiet",
    "d5d0c4 d9cab0 d9cab0 d9cab0 9f9f96 a19d8a a19d8a a19d8a 6d706c 6d6f62 6d6f62 6d6f62 3a403a 3b4138 3b4138 3b4138",
  ),
  style(
    "Cozy",
    "dcc09a e6b378 eca658 f0a040 a89070 a98550 a8803a ab7a30 76644c 785a3a 79552c 7a5026 44382c 463527 473123 472f20",
  ),
];

export const styles = strip.flatMap((entry) => (entry.divider ? [] : [entry.name]));

export type StyleName = string;

export const nameOf = (value: string | number | boolean | string[] | null | undefined): StyleName => {
  const name = String(value).toLowerCase();

  return styles.includes(name) ? name : "standard";
};

export const shift = (selected: StyleName, by: number): StyleName =>
  styles[Math.min(styles.length - 1, Math.max(0, styles.indexOf(selected) + by))] ?? selected;

export const CELL = 58;
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
