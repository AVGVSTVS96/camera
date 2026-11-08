import { createContext, useContext } from "react";
import type { Facing, Mode } from "./state.ts";

export interface Zoom {
  stops: number[];
  start: number;
}

export interface Profile {
  name: string;
  modes: Mode[];
  zoom: Partial<Record<`${Facing}-${Mode}`, Zoom>>;
  badges: boolean;
  smartTake: boolean;
  macro: boolean;
  grid: boolean;
  level: boolean;
  photoFormat: string;
  videoFormat: string;
  library: boolean;
}

const lenses: Zoom = { stops: [0.5, 1, 2], start: 1 };

export const duo: Profile = {
  name: "duo",
  modes: ["time-lapse", "slo-mo", "cinematic", "video", "photo", "portrait", "pano"],
  zoom: {
    "back-time-lapse": lenses,
    "back-slo-mo": lenses,
    "back-cinematic": lenses,
    "back-video": lenses,
    "back-photo": lenses,
    "back-portrait": lenses,
    "back-pano": lenses,
  },
  badges: true,
  smartTake: true,
  macro: true,
  grid: true,
  level: true,
  photoFormat: "HEIF 48",
  videoFormat: "4K 30",
  library: true,
};

export const ProfileContext = createContext(duo);

export const useProfile = () => useContext(ProfileContext);
