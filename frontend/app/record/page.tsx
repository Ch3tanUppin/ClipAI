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
type BubblePosition = "bottom-right" | "bottom-left" | "top-right" | "top-left" | "custom";

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

  // Floating webcam & PiP States
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isPiPSupported, setIsPiPSupported] = useState(false);
  const [pipWindow, setPipWindow] = useState<any>(null);

  // Draggable bubble states
  const [positionType, setPositionType] = useState<BubblePosition>("bottom-right");
  const [customCoords, setCustomCoords] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{
    clickOffsetX: number;
    clickOffsetY: number;
    containerRect: DOMRect | null;
  }>({
    clickOffsetX: 0,
    clickOffsetY: 0,
    containerRect: null,
  });

  // Audio mixing refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const screenAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micAudioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    setIsPiPSupported(typeof window !== "undefined" && "documentPictureInPicture" in window);
    return () => {
      if (typeof window !== "undefined" && (window as any).pipWindowInstance) {
        try {
          (window as any).pipWindowInstance.close();
        } catch {}
      }
    };
  }, []);

  useEffect(() => {
    if (!recording || paused) return;
    const timer = window.setInterval(() => setCount((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording, paused]);

  // Handle camera video element binding/playing on state change
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.srcObject = cameraStream;
      if (cameraStream) {
        cameraRef.current.muted = true;
        cameraRef.current.play().catch((err) => console.error("Error playing camera video:", err));
      }
    }
  }, [cameraStream]);

  // Watch screen stream and camera stream status
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
      if ((mode === "camera" || mode === "both") && cameraEnabled) {
        camera = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
    } catch (err) {
      camera = null;
    }
    return { screen, camera };
  }

  function populatePiP(pip: any, stream: MediaStream) {
    if (!pip || !stream) return;
    try {
      pip.document.body.innerHTML = "";
      const video = pip.document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      const style = pip.document.createElement("style");
      style.textContent = `
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background-color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100vw;
          height: 100vh;
        }
        video {
          width: 100vw;
          height: 100vh;
          object-fit: cover;
          border-radius: 12px;
          box-sizing: border-box;
          border: 4px solid #625df5;
        }
      `;
      pip.document.head.appendChild(style);
      pip.document.body.appendChild(video);

      pip.addEventListener("pagehide", () => {
        setPipWindow(null);
      });
    } catch (err) {
      console.error("Failed to populate Picture-in-Picture window:", err);
    }
  }

  async function enterPiP() {
    if (!isPiPSupported || !cameraStream) return;
    try {
      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 180,
        height: 180,
      });

      populatePiP(pip, cameraStream);

      (window as any).pipWindowInstance = pip;
      setPipWindow(pip);
    } catch (err) {
      console.error("Failed to open Picture-in-Picture window:", err);
    }
  }

  function exitPiP() {
    if (pipWindow) {
      try {
        pipWindow.close();
      } catch {}
      setPipWindow(null);
    }
    if (typeof window !== "undefined" && (window as any).pipWindowInstance) {
      try {
        (window as any).pipWindowInstance.close();
      } catch {}
      (window as any).pipWindowInstance = null;
    }
  }

  async function toggleWebcam() {
    const nextEnabled = !cameraEnabled;
    setCameraEnabled(nextEnabled);

    if (recording) {
      if (nextEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setCameraStream(stream);

          if (audioContextRef.current && micGainNodeRef.current) {
            if (micAudioSourceRef.current) {
              try { micAudioSourceRef.current.disconnect(); } catch {}
            }
            const micSource = audioContextRef.current.createMediaStreamSource(stream);
            micSource.connect(micGainNodeRef.current);
            micAudioSourceRef.current = micSource;
            micGainNodeRef.current.gain.setValueAtTime(1, audioContextRef.current.currentTime);
          }
        } catch (err) {
          console.error("Failed to enable webcam during recording:", err);
          setCameraEnabled(false);
        }
      } else {
        exitPiP();
        if (audioContextRef.current && micGainNodeRef.current) {
          micGainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        }
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
        setCameraStream(null);
      }
    } else {
      if (nextEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          setCameraStream(stream);
        } catch (err) {
          console.error("Failed to preview webcam:", err);
          setCameraEnabled(false);
        }
      } else {
        if (cameraStream) {
          cameraStream.getTracks().forEach((track) => track.stop());
        }
        setCameraStream(null);
      }
    }
  }

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const bubbleRect = e.currentTarget.getBoundingClientRect();

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);

    const clickOffsetX = e.clientX - bubbleRect.left;
    const clickOffsetY = e.clientY - bubbleRect.top;

    dragStart.current = {
      clickOffsetX,
      clickOffsetY,
      containerRect: rect,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const { clickOffsetX, clickOffsetY, containerRect } = dragStart.current;
    if (!containerRect) return;

    let x = e.clientX - containerRect.left - clickOffsetX;
    let y = e.clientY - containerRect.top - clickOffsetY;

    const bubbleSize = 144; // w-36 = 144px
    x = Math.max(0, Math.min(x, containerRect.width - bubbleSize));
    y = Math.max(0, Math.min(y, containerRect.height - bubbleSize));

    setPositionType("custom");
    setCustomCoords({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  async function start() {
    let pip: any = null;
    if (mode === "both" && cameraEnabled && isPiPSupported) {
      try {
        pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 180,
          height: 180,
        });
        (window as any).pipWindowInstance = pip;
        setPipWindow(pip);
      } catch (err) {
        console.error("Failed to pre-open PiP window:", err);
      }
    }

    let streams;
    try {
      streams = await buildStreams();
    } catch (err) {
      if (pip) pip.close();
      setPipWindow(null);
      return;
    }

    const { screen, camera } = streams;
    if (!screen && !camera) {
      if (pip) pip.close();
      setPipWindow(null);
      return;
    }

    setScreenStream(screen);
    setCameraStream(camera);

    if (pip && camera) {
      populatePiP(pip, camera);
    }

    // Show preview(s)
    if (previewRef.current) {
      previewRef.current.srcObject = screen ?? camera ?? null;
      previewRef.current.muted = true;
      try { await previewRef.current.play(); } catch {}
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";

    // Setup AudioContext mixing
    const recordedTracks: MediaStreamTrack[] = [];

    // Video Track
    if (mode === "both" || mode === "screen") {
      if (screen && screen.getVideoTracks().length > 0) {
        recordedTracks.push(screen.getVideoTracks()[0]);
      }
    } else if (mode === "camera") {
      if (camera && camera.getVideoTracks().length > 0) {
        recordedTracks.push(camera.getVideoTracks()[0]);
      }
    }

    // Audio Track mixing
    let mixedAudioTrack: MediaStreamTrack | null = null;
    let ctx: AudioContext | null = null;
    let dest: MediaStreamAudioDestinationNode | null = null;

    const hasScreenAudio = screen && screen.getAudioTracks().length > 0;
    const hasCameraAudio = camera && camera.getAudioTracks().length > 0;

    if (hasScreenAudio || hasCameraAudio) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        dest = ctx.createMediaStreamDestination();

        if (hasScreenAudio) {
          const screenSource = ctx.createMediaStreamSource(screen);
          screenSource.connect(dest);
          screenAudioSourceRef.current = screenSource;
        }

        if (hasCameraAudio) {
          const micSource = ctx.createMediaStreamSource(camera);
          const gainNode = ctx.createGain();
          gainNode.gain.value = cameraEnabled ? 1 : 0;
          micSource.connect(gainNode);
          gainNode.connect(dest);
          micGainNodeRef.current = gainNode;
          micAudioSourceRef.current = micSource;
        }

        const audioTracks = dest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          mixedAudioTrack = audioTracks[0];
          recordedTracks.push(mixedAudioTrack);
        }
      } catch (err) {
        console.error("Audio mixing failed, falling back to direct tracks:", err);
        if (hasCameraAudio && camera) {
          recordedTracks.push(camera.getAudioTracks()[0]);
        } else if (hasScreenAudio && screen) {
          recordedTracks.push(screen.getAudioTracks()[0]);
        }
      }
    }

    const merged = new MediaStream(recordedTracks);
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

      setScreenStream(null);
      setCameraStream(null);
      exitPiP();

      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch {}
        audioContextRef.current = null;
      }
      micGainNodeRef.current = null;
      screenAudioSourceRef.current = null;
      micAudioSourceRef.current = null;

      if (previewRef.current) {
        previewRef.current.srcObject = null;
        previewRef.current.src = URL.createObjectURL(output);
        previewRef.current.controls = true;
        previewRef.current.muted = false;
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
          <div ref={containerRef} className="relative overflow-hidden rounded-lg border border-slate-200 bg-[#111827] shadow-sm aspect-video">
            <video ref={previewRef} className="h-full w-full bg-black object-contain" playsInline />
            
            {/* Draggable floating webcam bubble */}
            {cameraEnabled && cameraStream && (
              <div
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                style={
                  positionType === "custom"
                    ? { left: `${customCoords.x}px`, top: `${customCoords.y}px` }
                    : undefined
                }
                className={`absolute z-50 h-36 w-36 cursor-move select-none overflow-hidden rounded-xl border-4 border-[#625df5] shadow-2xl transition-all duration-75 active:scale-95 group
                  ${positionType === "bottom-right" ? "right-4 bottom-4" : ""}
                  ${positionType === "bottom-left" ? "left-4 bottom-4" : ""}
                  ${positionType === "top-right" ? "right-4 top-4" : ""}
                  ${positionType === "top-left" ? "left-4 top-4" : ""}
                `}
              >
                <video
                  ref={cameraRef}
                  className="h-full w-full object-cover pointer-events-none"
                  playsInline
                  muted
                />
                
                {/* Overlay controls visible on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-1.5 p-2 text-white">
                  <div className="flex gap-2">
                    <button
                      title="Top Left"
                      onClick={(e) => { e.stopPropagation(); setPositionType("top-left"); }}
                      className="p-1 hover:bg-white/20 rounded text-[10px] font-bold"
                    >
                      TL
                    </button>
                    <button
                      title="Top Right"
                      onClick={(e) => { e.stopPropagation(); setPositionType("top-right"); }}
                      className="p-1 hover:bg-white/20 rounded text-[10px] font-bold"
                    >
                      TR
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      title="Bottom Left"
                      onClick={(e) => { e.stopPropagation(); setPositionType("bottom-left"); }}
                      className="p-1 hover:bg-white/20 rounded text-[10px] font-bold"
                    >
                      BL
                    </button>
                    <button
                      title="Bottom Right"
                      onClick={(e) => { e.stopPropagation(); setPositionType("bottom-right"); }}
                      className="p-1 hover:bg-white/20 rounded text-[10px] font-bold"
                    >
                      BR
                    </button>
                  </div>
                  <div className="flex gap-2 mt-1">
                    {isPiPSupported && (
                      <button
                        title="Toggle Floating Window"
                        onClick={(e) => { e.stopPropagation(); pipWindow ? exitPiP() : enterPiP(); }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${pipWindow ? 'bg-[#625df5] text-white' : 'bg-white/20 hover:bg-white/30'}`}
                      >
                        PiP
                      </button>
                    )}
                    <button
                      title="Disable Camera"
                      onClick={(e) => { e.stopPropagation(); toggleWebcam(); }}
                      className="px-1.5 py-0.5 bg-red-600/80 hover:bg-red-600 rounded text-[10px] font-bold text-white"
                    >
                      Off
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!recording && !blob && (
              <div className="absolute inset-0 grid place-items-center text-white bg-black/40">
                <div className="text-center">
                  <ScreenShare className="mx-auto mb-4 h-12 w-12 text-white/70" />
                  <p className="text-sm font-semibold text-white/70">Choose a mode, then start recording</p>
                </div>
              </div>
            )}
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

            {/* Webcam feed toggle */}
            {(mode === "both" || mode === "camera") && (
              <div className="mb-4 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                <span className="font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4 text-[#625df5]" />
                  Webcam Feed
                </span>
                <button
                  onClick={toggleWebcam}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${cameraEnabled ? "bg-[#625df5]" : "bg-slate-300"}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${cameraEnabled ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>
            )}

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
