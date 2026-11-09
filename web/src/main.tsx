import "./base.css";
import "./layout.css";
import { createRoot } from "react-dom/client";
import { Camera } from "./Camera.tsx";
import { restore, unseen } from "./memory.ts";
import { duo, ProfileContext, type Profile } from "./profile.ts";
import { initialSettings, loadState, poseOf, reached, settingsFor, type Settings } from "./state.ts";

declare global {
  interface Window {
    camera?: Settings;
  }
}

const launch = (profile: Profile): Settings => ({
  ...restore(initialSettings(profile, poseOf(innerWidth, innerHeight))),
  sheet: unseen("styles"),
});

const root = createRoot(document.getElementById("root")!);
const params = new URLSearchParams(location.search);
const id = params.get("state");
const live = params.get("live");

if (id) {
  const state = await loadState(id);
  document.documentElement.dataset.still = "";
  root.render(
    <ProfileContext value={state.profile ?? duo}>
      <Camera initial={params.has("reached") ? reached(state) : settingsFor(state)} still={id} />
    </ProfileContext>,
  );
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => (document.documentElement.dataset.ready = "")));
} else if (live) {
  const { profile = duo } = await loadState(live);
  root.render(
    <ProfileContext value={profile}>
      <Camera initial={launch(profile)} onSettings={(settings) => (window.camera = settings)} />
    </ProfileContext>,
  );
} else {
  root.render(<Camera initial={launch(duo)} />);
}
