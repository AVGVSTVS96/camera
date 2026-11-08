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

This builds `web/`, renders 12 of the component's states and prints the worst with the paths of Apple's screenshot, ours and the diff. The sample spreads across profile, display and orientation and takes the worst-scoring states first, from your earlier runs or else the last full run, so each round looks at what's most wrong. Read the images, change your code, run again.

The spec for your component, with its regions per state, is `~/Developer/camera-research/answer-key/specs/components/<component>.json`. The answer key is private: nothing from it, or from `camera-research/`, goes in the repo.

Before you push, run a bigger sample (`--sample 60`, or no `--sample` when the component has few states) and `bun run check`. The full run from `~/Developer/camera` is the authority and the only run that publishes the scoreboard, to http://100.113.223.113:4800/camera-parity:

```sh
cd ~/Developer/camera && git pull
TURN_POOL=parity TURN_SLOTS=4 PROCESSES=8 BROWSERS=1 turn bun run diff
```

`PROCESSES` splits the states across that many processes, each with `BROWSERS` WebKits; all 1,171 states take about 12 minutes this way.

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

A push rejected because main moved rebases and tries again. A rebase conflict stops the loop: resolve it keeping both sides' intent, `git rebase --continue`, run `bun run check`, push again.

When you're done: `git worktree remove ~/Developer/camera-wt/<component>`.
