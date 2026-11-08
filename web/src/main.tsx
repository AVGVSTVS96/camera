import { createRoot } from "react-dom/client";
import { Camera } from "./Camera.tsx";
import { initialSettings, loadState, settingsFor } from "./state.ts";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
const id = new URLSearchParams(location.search).get("state");

if (id) {
  const state = await loadState(id);
  document.documentElement.dataset.still = "";
  root.render(<Camera initial={settingsFor(state)} still={id} />);
  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => (document.documentElement.dataset.ready = "")));
} else {
  root.render(<Camera initial={initialSettings} />);
}
