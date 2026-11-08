import { basename, join } from "node:path";

const research = join(process.env.HOME!, "Developer/camera-research");
const repo = join(import.meta.dir, "..");

export const key = process.env.KEY ?? join(research, "answer-key");
export const duo = join(research, "duo");
export const specs = join(key, "specs");
export const out = process.env.OUT ?? join(research, "parity", basename(repo));
export const dist = join(repo, "web/dist");
