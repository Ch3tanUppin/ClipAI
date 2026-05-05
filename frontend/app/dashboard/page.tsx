"use client";

import Link from "next/link";
import { Bot, Copy, FileText, Lock, MessageCircle, MoreHorizontal, Pencil, PlayCircle, Search, Share2, Trash2, Video as VideoIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Protected } from "@/components/Protected";
import { deleteVideo, generateAiSummary, listVideos, renameVideo, updateVideo } from "@/lib/api";
import type { Video } from "@/lib/types";

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Video | null>(null);

  async function refresh() {
    setLoading(true);
    const items = await listVideos();
    setVideos(items);
    setSelected((current) => items.find((item) => item.id === current?.id) ?? items[0] ?? null);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => videos.filter((video) => video.title.toLowerCase().includes(query.toLowerCase())), [query, videos]);

  async function copyShare(video: Video) {
    await navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/v/${video.publicId}`);
  }

  return (
    <Protected>
      <AppShell>
        <div className="grid gap-6 lg:grid-cols-[260px_1fr_360px]">
          <aside className="hidden border-r border-slate-200 pr-4 lg:block">
            <Link href="/record"><Button className="mb-5 w-full"><VideoIcon className="h-4 w-4" />Record a ClipAI</Button></Link>
            <nav className="grid gap-1 text-sm font-semibold text-slate-600">
              {["Library", "Shared with me", "Meeting notes", "Screenshots", "Archive"].map((item, index) => (
                <button key={item} className={`flex items-center justify-between rounded-md px-3 py-2 text-left ${index === 0 ? "bg-white text-ink shadow-sm" : "hover:bg-white"}`}>
                  {item}<span className="text-xs text-slate-400">{index === 0 ? videos.length : ""}</span>
                </button>
              ))}
            </nav>
          </aside>

          <section>
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-black">Library</h1>
                <p className="text-sm text-slate-500">Recordings, meeting recaps, comments, reactions, and share links.</p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-slate-400" />
                <input className="w-48 border-0 bg-transparent text-sm outline-none" placeholder="Search videos" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
            </div>

            {loading ? <p className="text-sm text-slate-500">Loading videos</p> : (
              <div className="grid gap-3">
                {filtered.map((video) => {
                  const thumbnail = video.assets.find((asset) => asset.type === "THUMBNAIL");
                  const playback = video.assets.find((asset) => asset.type === "MP4") ?? video.assets.find((asset) => asset.type === "ORIGINAL");
                  return (
                    <article key={video.id} onClick={() => setSelected(video)} className={`grid cursor-pointer gap-4 rounded-lg border bg-white p-4 shadow-sm transition hover:border-[#625df5] md:grid-cols-[180px_1fr_auto] ${selected?.id === video.id ? "border-[#625df5]" : "border-slate-200"}`}>
                      <div className="relative aspect-video overflow-hidden rounded-md bg-[#171923]">
                        {thumbnail ? <img src={thumbnail.cdnUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-white"><PlayCircle className="h-9 w-9" /></div>}
                        {playback && <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-xs font-bold text-white">Ready</span>}
                      </div>
                      <div>
                        <Link href={`/v/${video.publicId}`} className="text-lg font-black hover:text-[#625df5]">{video.title}</Link>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{video.summary || video.description || "No summary yet. Generate one from the detail panel."}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2 py-1">{video.status}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{video.privacy?.replace("_", " ")}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{video.comments?.length ?? 0} comments</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="secondary" aria-label="Copy link" onClick={(event) => { event.stopPropagation(); copyShare(video); }}><Copy className="h-4 w-4" /></Button>
                        <Button variant="secondary" aria-label="Rename" onClick={async (event) => {
                          event.stopPropagation();
                          const title = window.prompt("Video title", video.title);
                          if (title) {
                            await renameVideo(video.id, title);
                            refresh();
                          }
                        }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="danger" aria-label="Delete" onClick={async (event) => {
                          event.stopPropagation();
                          await deleteVideo(video.id);
                          refresh();
                        }}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            {selected ? (
              <div>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Details</p>
                    <h2 className="mt-1 text-xl font-black">{selected.title}</h2>
                  </div>
                  <MoreHorizontal className="h-5 w-5 text-slate-400" />
                </div>
                <div className="grid gap-2">
                  <Link href={`/v/${selected.publicId}`}><Button className="w-full"><Share2 className="h-4 w-4" />Open share page</Button></Link>
                  <Button variant="secondary" className="w-full" onClick={async () => { await generateAiSummary(selected.id); refresh(); }}><Bot className="h-4 w-4" />Generate AI notes</Button>
                  <Button variant="secondary" className="w-full" onClick={async () => { await updateVideo(selected.id, { privacy: selected.privacy === "PRIVATE" ? "PUBLIC_LINK" : "PRIVATE" }); refresh(); }}><Lock className="h-4 w-4" />Toggle privacy</Button>
                </div>
                <div className="mt-6 rounded-md bg-[#f6f7fb] p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-black"><FileText className="h-4 w-4 text-[#625df5]" />AI summary</div>
                  <p className="text-sm leading-6 text-slate-600">{selected.summary || "Generate AI notes to create a concise recap and transcript."}</p>
                </div>
                <div className="mt-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-black"><MessageCircle className="h-4 w-4 text-[#625df5]" />Latest comments</div>
                  <div className="grid gap-3">
                    {(selected.comments ?? []).slice(0, 3).map((comment) => <div key={comment.id} className="rounded-md border border-slate-200 p-3 text-sm"><b>{comment.authorName}</b><p className="mt-1 text-slate-600">{comment.body}</p></div>)}
                    {(selected.comments ?? []).length === 0 && <p className="text-sm text-slate-500">No viewer comments yet.</p>}
                  </div>
                </div>
              </div>
            ) : <p className="text-sm text-slate-500">Select a video to see share controls.</p>}
          </aside>
        </div>
      </AppShell>
    </Protected>
  );
}
