import type { Shot } from "../../capture.ts";
import { useProfile } from "../../profile.ts";
import "./thumbnail.css";

export function Thumbnail({ shot, open }: { shot?: Shot; open: () => void }) {
  const { library } = useProfile();

  return (
    <button className="thumb lead" data-empty={!library || undefined} aria-label="Photos" onClick={open}>
      {shot && <img src={shot.poster ?? shot.url} alt="" />}
    </button>
  );
}
