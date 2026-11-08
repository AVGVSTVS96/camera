import { join } from "node:path";
import { dist, specs } from "./paths.ts";
import { scene } from "./scene.ts";
import { states } from "./states.ts";

export async function serve(port = 0) {
  const all = await states();
  const simulator = await Bun.file(join(specs, "profiles/simulator.json")).json();

  const published = all.map(({ image: _i, views: _v, ax: _a, ...s }) => ({
    ...s,
    profile: s.profile === "simulator" ? simulator : undefined,
  }));

  return Bun.serve({
    port,
    async fetch(request) {
      const path = new URL(request.url).pathname;

      if (path === "/states.json") return Response.json(published);
      const plateId = path.match(/^\/plates\/([\w-]+)\.png$/)?.[1];

      if (plateId) {
        const state = all.find((s) => s.id === plateId);

        return state ? new Response(Bun.file((await scene(state)).plate)) : new Response("not found", { status: 404 });
      }

      const file = Bun.file(join(dist, path === "/" ? "index.html" : path));

      return (await file.exists()) ? new Response(file) : new Response(Bun.file(join(dist, "index.html")));
    },
  });
}

if (import.meta.main) {
  const server = await serve(Number(process.env.PORT ?? 4173));
  console.log(`Serving web/dist and the answer key at ${server.url}?state=<id>`);
}
