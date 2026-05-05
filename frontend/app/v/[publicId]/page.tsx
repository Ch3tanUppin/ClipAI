"use client";

import { Bot, Copy, MessageCircle, Send, Sparkles, ThumbsUp } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { addSharedComment, addSharedReaction, getSharedVideo } from "@/lib/api";
import type { Video } from "@/lib/types";

export default function SharedVideoPage({ params }: { params: { publicId: string } }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [authorName, setAuthorName] = useState("Guest");
  const [body, setBody] = useState("");

  async function refresh() {
    setVideo(await getSharedVideo(params.publicId));
  }

  useEffect(() => {
    refresh();
  }, [params.publicId]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    await addSharedComment(params.publicId, { authorName, body });
    setBody("");
    refresh();
  }

  if (!video) {
    return <main className="grid min-h-screen place-items-center bg-cloud text-sm text-slate-500">Loading video</main>;
  }

  const playback = video.assets.find((asset) => asset.type === "HLS") ?? video.assets.find((asset) => asset.type === "MP4") ?? video.assets.find((asset) => asset.type === "ORIGINAL");
  const share = `${process.env.NEXT_PUBLIC_APP_URL}/v/${video.publicId}`;
  const emojis = ["👍", "🎉", "💡", "❤️"];

  return (
    <main className="min-h-screen bg-[#f6f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-lg font-black"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#625df5] text-white">C</span>ClipAI</div>
          <Button variant="secondary" onClick={() => navigator.clipboard.writeText(share)}><Copy className="h-4 w-4" />Copy link</Button>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-5">
            <h1 className="text-3xl font-black">{video.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{new Date(video.createdAt).toLocaleString()} · {video.status}</p>
          </div>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-black shadow-sm">
            {playback ? <video className="aspect-video w-full bg-black" src={playback.cdnUrl} controls playsInline /> : <div className="grid aspect-video place-items-center text-white">Processing</div>}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            {emojis.map((emoji) => (
              <button key={emoji} onClick={async () => { await addSharedReaction(params.publicId, emoji); refresh(); }} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold shadow-sm">
                {emoji} {video.reactions?.[emoji] ?? 0}
              </button>
            ))}
            {video.ctaUrl && <a href={video.ctaUrl} className="rounded-md bg-[#625df5] px-4 py-2 text-sm font-bold text-white">{video.ctaLabel || "Open link"}</a>}
          </div>
        </section>

        <aside className="grid gap-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black"><Bot className="h-4 w-4 text-[#625df5]" />AI summary</div>
            <p className="text-sm leading-6 text-slate-600">{video.summary || "The owner has not generated an AI summary yet."}</p>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-black"><Sparkles className="h-4 w-4 text-[#625df5]" />Transcript</div>
            <pre className="max-h-52 whitespace-pre-wrap rounded-md bg-[#f6f7fb] p-3 text-sm leading-6 text-slate-600">{video.transcript || "Transcript will appear here after processing."}</pre>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-black"><MessageCircle className="h-4 w-4 text-[#625df5]" />Comments</div>
            <form onSubmit={submit} className="mb-4 grid gap-2">
              <input className="rounded-md border border-slate-300 px-3 py-2 text-sm" value={authorName} onChange={(event) => setAuthorName(event.target.value)} placeholder="Your name" />
              <textarea className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Leave feedback" />
              <Button><Send className="h-4 w-4" />Post comment</Button>
            </form>
            <div className="grid gap-3">
              {(video.comments ?? []).map((comment) => <article key={comment.id} className="rounded-md border border-slate-200 p-3 text-sm"><div className="font-black">{comment.authorName}</div><p className="mt-1 leading-6 text-slate-600">{comment.body}</p></article>)}
              {(video.comments ?? []).length === 0 && <p className="flex items-center gap-2 text-sm text-slate-500"><ThumbsUp className="h-4 w-4" />Be the first to respond.</p>}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
