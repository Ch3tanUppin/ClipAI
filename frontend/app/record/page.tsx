"use client";

import axios from "axios";
import { Camera, Mic, Monitor, Pause, Play, ScreenShare, Sparkles, Square, Upload, Video as VideoIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Protected } from "@/components/Protected";
import { createVideo, requestUploadUrl } from "@/lib/api";

type Mode = "screen" | "camera" | "both";

export default function RecordPage() {
  const router = useRouter();
  const previewRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [mode, setMode] = useState<Mode>("both");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [title, setTitle] = useState("Untitled recording");
  const [progress, setProgress] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!recording || paused) return;
    const timer = window.setInterval(() => setCount((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording, paused]);

  async function buildStreams() {
    let screen: MediaStream | null = null;
    let camera: MediaStream | null = null;
    try {
      if (mode === "screen" || mode === "both") {
        screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      }
    } catch (err) {
      screen = null;
    }
    try {
      if (mode === "camera" || mode === "both") {
        camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
    } catch (err) {
      camera = null;
    }
    return { screen, camera };
  }

  async function start() {
    const { screen, camera } = await buildStreams();
    // Show preview(s)
    if (previewRef.current) {
      previewRef.current.srcObject = screen ?? camera ?? null;
      previewRef.current.muted = true;
      try { await previewRef.current.play(); } catch {}
    }
    if (cameraRef.current) {
      cameraRef.current.srcObject = camera ?? null;
      cameraRef.current.muted = true;
      try { await cameraRef.current.play(); } catch {}
    }
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
    // Merge tracks from both streams for recording
    const tracks: MediaStreamTrack[] = [];
    if (screen) tracks.push(...screen.getTracks());
    if (camera) tracks.push(...camera.getTracks());
    const merged = new MediaStream(tracks);
    const recorder = new MediaRecorder(merged, { mimeType });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      const output = new Blob(chunksRef.current, { type: "video/webm" });
      setBlob(output);
      // stop all original streams' tracks
      if (screen) screen.getTracks().forEach((t) => t.stop());
      if (camera) camera.getTracks().forEach((t) => t.stop());
      if (previewRef.current) {
        previewRef.current.srcObject = null;
        previewRef.current.src = URL.createObjectURL(output);
        previewRef.current.controls = true;
        previewRef.current.muted = false;
      }
      if (cameraRef.current) {
        cameraRef.current.srcObject = null;
      }
    };
    recorder.start(1000);
    recorderRef.current = recorder;
    setRecording(true);
    setPaused(false);
    setCount(0);
  }

  function pause() {
    const recorder = recorderRef.current;
    if (!recorder) return;
    if (paused) {
      recorder.resume();
      setPaused(false);
    } else {
      recorder.pause();
      setPaused(true);
    }
  }

  function stop() {
    recorderRef.current?.stop();
    setRecording(false);
    setPaused(false);
  }

  async function upload() {
    if (!blob) return;
    const file = new File([blob], `${title || "recording"}.webm`, { type: "video/webm" });
    const { uploadUrl, objectKey } = await requestUploadUrl(file);
    await axios.put(uploadUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (event) => setProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0)
    });
    await createVideo({ title, objectKey, sizeBytes: file.size });
    router.push("/dashboard");
  }

  return (
    <Protected>
      <AppShell>
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black">Record</h1>
            <p className="text-sm text-slate-500">Capture screen, camera, microphone, or a combined recording.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
            <span className={`h-2 w-2 rounded-full ${recording && !paused ? "bg-coral" : "bg-slate-300"}`} />
            {Math.floor(count / 60).toString().padStart(2, "0")}:{(count % 60).toString().padStart(2, "0")}
          </div>
        </div>
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-[#111827] shadow-sm">
            <video ref={previewRef} className="aspect-video h-full w-full bg-black object-contain" playsInline />
            <video ref={cameraRef} className="absolute right-4 bottom-4 h-28 w-48 rounded-md border-2 border-white object-cover shadow-lg" playsInline />
            {!recording && !blob && <div className="-mt-[56.25%] grid aspect-video place-items-center text-white"><div className="text-center"><ScreenShare className="mx-auto mb-4 h-12 w-12 text-white/70" /><p className="text-sm font-semibold text-white/70">Choose a mode, then start recording</p></div></div>}
          </div>
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-4 block text-sm font-medium">Title<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <div className="mb-4 grid gap-2">
              {([
                ["screen", Monitor, "Screen only"],
                ["camera", Camera, "Camera only"],
                ["both", VideoIcon, "Screen and cam"]
              ] as const).map(([item, Icon, label]) => (
                <button key={item} className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm font-bold ${mode === item ? "border-[#625df5] bg-[#eef0ff] text-[#3832c8]" : "border-slate-300 bg-white"}`} onClick={() => setMode(item as Mode)}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
            <div className="mb-4 grid gap-2 rounded-md bg-[#f6f7fb] p-3 text-sm">
              <div className="flex items-center gap-2 font-semibold"><Mic className="h-4 w-4 text-[#625df5]" />Audio capture enabled</div>
              <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-4 w-4 text-[#625df5]" />AI notes after upload</div>
            </div>
            <div className="grid gap-2">
              {!recording && <Button onClick={start}><ScreenShare className="h-4 w-4" />Start</Button>}
              {recording && <Button variant="secondary" onClick={pause}>{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? "Resume" : "Pause"}</Button>}
              {recording && <Button variant="danger" onClick={stop}><Square className="h-4 w-4" />Stop</Button>}
              <Button disabled={!blob || progress > 0} onClick={upload}><Upload className="h-4 w-4" />Upload</Button>
            </div>
            {progress > 0 && <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand" style={{ width: `${progress}%` }} /></div>}
            <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><VideoIcon className="h-4 w-4" />Preview is available after stopping.</p>
          </aside>
        </section>
      </AppShell>
    </Protected>
  );
}
