import "./base.css";
import "./layout.css";
import { createRoot } from "react-dom/client";
import { Camera } from "./Camera.tsx";
import { duo, ProfileContext } from "./profile.ts";
import { initialSettings, loadState, poseOf, settingsFor, type Settings } from "./state.ts";

declare global {
  interface Window {
    camera?: Settings;
  }
}

const root = createRoot(document.getElementById("root")!);
const params = new URLSearchParams(location.search);
const id = params.get("state");
const live = params.get("live");

if (id) {
  const state = await loadState(id);
  document.documentElement.dataset.still = "";
  root.render(
    <ProfileContext value={state.profile ?? duo}>
      <Camera initial={settingsFor(state)} still={id} />
    </ProfileContext>,
  );
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => (document.documentElement.dataset.ready = "")));
} else if (live) {
  const { profile = duo } = await loadState(live);
  root.render(
    <ProfileContext value={profile}>
      <Camera
        initial={initialSettings(profile, poseOf(innerWidth, innerHeight))}
        onSettings={(settings) => (window.camera = settings)}
      />
    </ProfileContext>,
  );
} else {
  root.render(<Camera initial={initialSettings(duo, poseOf(innerWidth, innerHeight))} />);
}
