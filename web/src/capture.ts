import { useEffect, useRef, useState } from "react";
import { useRamp } from "./components/zoom/ramp.ts";
import type { Settings } from "./state.ts";

declare global {
  interface MediaTrackConstraintSet {
    zoom?: number;
  }
}

export interface Shot {
  url: string;
  file: File;
  poster?: string;
  frame?: File;
}

export function useCamera(settings: Settings, enabled: boolean) {
  const video = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream>();
  const zoom = useRamp(settings.zoom, `${settings.mode}${settings.facing}`, video);

  useEffect(() => {
    if (!enabled) return;
    let current: MediaStream | undefined;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: settings.facing === "front" ? "user" : "environment",
          width: { ideal: 4032 },
          height: { ideal: 3024 },
        },
        audio: false,
      })
      .then((s) => {
        current = s;
        setStream(s);

        if (video.current) video.current.srcObject = s;
      })
      .catch(() => {});

    return () => current?.getTracks().forEach((t) => t.stop());
  }, [enabled, settings.facing]);

  useEffect(() => {
    const track = stream?.getVideoTracks()[0];

    if (track && "zoom" in track.getCapabilities()) {
      track.applyConstraints({ advanced: [{ zoom }] }).catch(() => {});
    }
  }, [stream, zoom]);

  return { video, stream };
}

export function snapshot(video: HTMLVideoElement) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d")!.drawImage(video, 0, 0);

  return new Promise<Shot>((resolve) =>
    canvas.toBlob(
      (blob) => {
        const file = new File([blob!], `IMG_${Date.now()}.jpg`, { type: "image/jpeg" });
        resolve({ url: URL.createObjectURL(file), file });
      },
      "image/jpeg",
      0.95,
    ),
  );
}

export interface Recording {
  stop: () => Promise<File>;
  pause: () => void;
  resume: () => void;
}

export function record(stream: MediaStream): Recording {
  const type = ["video/mp4", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  const recorder = new MediaRecorder(stream, { mimeType: type });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();

  return {
    stop: () =>
      new Promise<File>((resolve) => {
        recorder.onstop = () =>
          resolve(new File(chunks, `VID_${Date.now()}.${type.includes("mp4") ? "mp4" : "webm"}`, { type }));
        recorder.stop();
      }),
    pause: () => recorder.pause(),
    resume: () => recorder.resume(),
  };
}

export async function save(file: File) {
  if (navigator.canShare?.({ files: [file] })) return navigator.share({ files: [file] });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(file);
  link.download = file.name;
  link.click();
}
