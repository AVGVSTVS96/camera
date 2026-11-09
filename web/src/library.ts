import { useEffect, useState } from "react";
import type { Shot } from "./capture.ts";

interface Row {
  file: File;
  frame?: File;
}

const wait = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });

const open = () => {
  const request = indexedDB.open("camera", 1);
  request.addEventListener("upgradeneeded", () => request.result.createObjectStore("shots", { autoIncrement: true }));

  return wait(request);
};

const toShot = ({ file, frame }: Row): Shot => ({
  file,
  url: URL.createObjectURL(file),
  poster: frame && URL.createObjectURL(frame),
  frame,
});

export function useLibrary() {
  const [shots, setShots] = useState<Shot[]>([]);

  useEffect(() => {
    if (!globalThis.indexedDB) return;

    open()
      .then((db) => wait(db.transaction("shots").objectStore("shots").getAll()))
      .then((rows) => setShots((now) => [...rows.map(toShot), ...now]))
      .catch(() => {});
  }, []);

  function add(shot: Shot) {
    setShots((now) => [...now, shot]);

    if (!globalThis.indexedDB) return;

    open()
      .then((db) =>
        db.transaction("shots", "readwrite").objectStore("shots").add({ file: shot.file, frame: shot.frame }),
      )
      .catch(() => {});
  }

  return { shots, add };
}
