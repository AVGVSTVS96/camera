import { existsSync } from "node:fs";
import { join } from "node:path";

const research = join(process.env.HOME!, "Developer/camera-research");
const answerKey = join(research, "answer-key");

export const key =
  process.env.KEY ?? (existsSync(join(answerKey, "states.json")) ? answerKey : join(research, "provisional-key"));

export const out = process.env.OUT ?? join(research, "parity");
export const dist = join(import.meta.dir, "../web/dist");
