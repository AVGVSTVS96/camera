# Workers

Each worker owns one component from `answer-key/specs/index.json` and works in its own checkout, so many can score at once.

Everything runs on the server (`ssh bassim@server`), in `~/Developer`: the repo, the private `camera-research/` beside it and the worktrees. The Mac runs nothing unless the server is overloaded.

## Set up

```sh
cd ~/Developer/camera
git fetch origin
git worktree add --detach ~/Developer/camera-wt/<component> origin/main
cd ~/Developer/camera-wt/<component>
bun install
```

Results go to `~/Developer/camera-research/parity/<component>/`, and every run serves on its own port, so workers never share output. Unfinished edits from earlier workers are in `~/Developer/camera-research/wip/wip-<component>.patch`, against an older main: read yours before you start, if there is one.

Scoring renders in Playwright WebKit with Apple's San Francisco fonts from `~/Developer/camera-research/fonts/`, which `fonts.conf` there maps to `system-ui`, `ui-monospace` and `ui-rounded`. They never go in the repo or the site.

## Iterate

```sh
TURN_POOL=parity TURN_SLOTS=4 turn bun run diff --component <component> --sample 12
```

`turn` lets four parity runs go at once, at the lowest CPU priority, and queues the rest. A run is one process rendering in three WebKits at once (`BROWSERS`) and takes about 20 seconds for 12 states.

This builds `web/`, renders 12 of the component's states and prints the worst with the paths of Apple's screenshot, ours and the diff, then the worst elements with a crop of each (Apple left, ours right).

A score is the geometric mean of two numbers. Pixels is the share of the region's pixels that match Apple's. Elements is the mean score of every mark Apple draws there (a glyph, a word, a ring, an outline), each counted the same however small: it compares edges, so a wrong weight, size or shape scores low, a mark ours draws off its spot loses a little per point, and a mark ours draws where Apple has nothing scores 0. The sample spreads across profile, display and orientation and takes the worst-scoring states first, from your earlier runs or else the last full run, so each round looks at what's most wrong. Read the images, change your code, run again.

The spec for your component, with its regions per state, is `~/Developer/camera-research/answer-key/specs/components/<component>.json`. The answer key is private: nothing from it, or from `camera-research/`, goes in the repo.

Before you push, run a bigger sample (`--sample 60`, or no `--sample` when the component has few states) and `bun run check`. The full run from `~/Developer/camera` is the authority and the only run that publishes the scoreboard, to http://100.113.223.113:4800/camera-parity:

```sh
cd ~/Developer/camera && git pull
TURN_POOL=parity TURN_SLOTS=4 PROCESSES=8 BROWSERS=1 turn bun run diff
```

`PROCESSES` splits the states across that many processes, each with `BROWSERS` WebKits; all 1,171 states take about 12 minutes this way.

## Prove behavior

`bun run diff` scores states forced through `?state=`. `bun run interact` checks that a person can reach them:

```sh
TURN_POOL=parity TURN_SLOTS=4 turn bun run interact --component <component> --sample 12
bun run interact photo-outer-portrait-flash-on   # one state, its verdict and why
```

It opens the real app (`?live=<id>`) in Chromium as a phone of that state's size, with a gray fake camera, Apple's plate behind it and a paused clock, then replays the taps Apple's capture scripts made from launch: Camera Controls → Expand → Flash → On. Each step finds its target the way VoiceOver does, by Apple's accessibility label (any case), so a control needs Apple's label (`aria-label`, or its text) to be reachable. Taps and gestures are real touches; waits move the clock; sliders take ArrowUp/ArrowDown, one tick each. Each state ends as:

- **reachable**: the app's settings equal `reached(state)` and the live screenshot scores within 3 points of the forced one, per component. The forced render for this comparison is `?state=<id>&reached`, which shows `reached()` and leaves out `settingsFor()`'s leftovers.
- **unreachable**: a step's target is missing or covered, or a step changed nothing and the end state is wrong. The step is named.
- **wrong**: every step did something, but the settings differ (each field is listed) or the live render scores lower.

Your component's transitions are timed too: CSS animations are paused and stepped frame by frame, measured as `tools/motion.py` measures Apple's videos, and match when the duration is within 15% and the progress curve within 0.1 RMSE of `motion.json`.

The full run from `~/Developer/camera` adds a Live column (reachable / wrong / unreachable) to the scoreboard:

```sh
cd ~/Developer/camera && git pull
TURN_POOL=parity TURN_SLOTS=4 BROWSERS=8 turn bun run interact
```

### Remembered vs simulator artifact

`settingsFor()` adds what Apple's simulator carried over from earlier captures to `reached()`, so the still scorer matches Apple's pixels. The answer key's `manifest.jsonl` order shows where each one came from, and none of them follows from the taps a person makes from launch, so the live app doesn't implement them and `interact` doesn't count them:

- `depth`: tapping Depth turns it on, and `reached()` and the Depth button do that. What is left over is the oracle not turning it off after `*-depth-depth`, so every later control state in that pose (Flash, Timer, White Balance, Night Mode, ...) shows it on.
- `lighting`: the `*-lighting-inc/dec` states move the Portrait Lighting cube, and the states after them keep where it stopped.
- `zoomTurn`: the stops' glyph turn follows the Device Hub orientation the last touch left behind (a viewfinder tap flips it 180 in portrait Photo), not any control.
- `night`: most Night Mode submenus open on Off, which earlier captures in the pose left, though a launch opens it on Auto.
- `wideTimeLapse`, `apertureOf`, sticky 4K: Time-lapse left on the ultra wide lens, the f-stop and the 4K choice from earlier states in the pose.

Camera does keep Portrait Lighting and Depth while the app stays open, and the live model does too: `switchMode` and every submenu leave `lighting` and `depth` alone, so a route that sets them keeps them. A turn of the stops with the device (Apple rotates glyphs, not the window) is real, but it follows the pose and belongs to posture, not to these leftovers. A difference that isn't one of these fields is a real difference: it stays "wrong".

## What you own

`web/src/components/<component>/`: its markup, its styles (`<component>.css`) and its icons (`icons.tsx`). Start every selector you add with your component's own class, since all CSS is global.

Shared, so keep your edits there to the lines your component needs:

- `Camera.tsx`: which component sits in which row and when it shows.
- `layout.css`: the screen, rows and slots per display, orientation and fold.
- `state.ts`: `Settings` and how a state's controls become settings.
- `profile.ts`: what the simulator and the Duo have.
- `base.css` and `icons.tsx`: the reset, glass and round buttons, badges, and glyphs more than one component draws.

A component that isn't built yet gets a new folder and one line in `Camera.tsx` where Apple places it.

## Commit

Commits are signed (check `git cat-file -p HEAD` shows a signature) and follow Conventional Commits with the component as scope, like `fix(shutter): ring width on the inner display`.

```sh
git add -A && git commit -m "fix(<component>): <what>"
git fetch origin && git rebase origin/main && bun run check
until git push origin HEAD:main; do git fetch origin && git rebase origin/main || break; done
```

Every push runs `bun run verify` (check plus build) through `.githooks/pre-push`, which `bun install` turns on, so what reaches main always builds, even after a rebase merged two workers' changes. A push rejected because main moved rebases and tries again. A rebase conflict stops the loop: resolve it keeping both sides' intent, `git rebase --continue`, run `bun run check`, push again.

When you're done: `git worktree remove ~/Developer/camera-wt/<component>`.
