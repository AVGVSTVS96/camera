import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const research = process.env.RESEARCH ?? join(homedir(), "Developer/camera-research");
const repo = join(import.meta.dir, "..");
const localPages = join(homedir(), "Developer/pages/pages");

export const key = process.env.KEY ?? join(research, "answer-key");
export const duo = join(research, "duo");
export const specs = join(key, "specs");
export const fontconfig = join(research, "fonts/fonts.conf");
export const mainOut = join(research, "parity", "camera");
export const out = process.env.OUT ?? join(research, "parity", basename(repo));
export const dist = join(repo, "web/dist");
export const pages = process.env.PAGES ?? (existsSync(localPages) ? localPages : "bassim@server:Developer/pages/pages");
