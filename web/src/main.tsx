import "./base.css";
import "./layout.css";
import { createRoot } from "react-dom/client";
import { Camera } from "./Camera.tsx";
import { duo, ProfileContext } from "./profile.ts";
import { initialSettings, loadState, settingsFor } from "./state.ts";

const root = createRoot(document.getElementById("root")!);
const id = new URLSearchParams(location.search).get("state");

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
} else {
  root.render(<Camera initial={initialSettings(duo)} />);
}
