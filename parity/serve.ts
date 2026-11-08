import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import { dist, key, out } from "./paths.ts";
import { plate } from "./plate.ts";

export async function states(): Promise<State[]> {
  return Bun.file(join(key, "states.json")).json();
}

export interface State {
  id: string;
  image: string;
  mode: string;
  display: string;
  orientation: string;
  screen: { widthPt: number; heightPt: number; scale: number };
}

export async function platePath(state: State) {
  const file = join(out, "plates", `${state.id}.png`);
  const source = Bun.file(join(key, state.image));

  if (!existsSync(file) || (await Bun.file(file).stat()).mtimeMs < source.lastModified) {
    mkdirSync(join(out, "plates"), { recursive: true });
    await Bun.write(file, PNG.sync.write(plate(PNG.sync.read(Buffer.from(await source.arrayBuffer())))));
  }

  return file;
}

export function serve(port = 0) {
  return Bun.serve({
    port,
    async fetch(request) {
      const path = new URL(request.url).pathname;

      if (path === "/states.json") return new Response(Bun.file(join(key, "states.json")));
      const plateId = path.match(/^\/plates\/([\w-]+)\.png$/)?.[1];

      if (plateId) {
        const state = (await states()).find((s) => s.id === plateId);

        return state ? new Response(Bun.file(await platePath(state))) : new Response("not found", { status: 404 });
      }

      const file = Bun.file(join(dist, path === "/" ? "index.html" : path));

      return (await file.exists()) ? new Response(file) : new Response(Bun.file(join(dist, "index.html")));
    },
  });
}

if (import.meta.main) {
  const server = serve(Number(process.env.PORT ?? 4173));
  console.log(`Serving web/dist with ${key} at ${server.url}?state=<id>`);
}
