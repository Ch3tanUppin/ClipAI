import Link from "next/link";
import { Bot, Camera, CheckCircle2, MessageSquare, MousePointerClick, Play, ScreenShare, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/Button";

const features = [
  { icon: Video, title: "Video messages", text: "Record your screen, camera, or both and share a polished link in seconds." },
  { icon: MessageSquare, title: "Meeting recaps", text: "Turn long syncs into summaries, transcripts, and action-ready notes." },
  { icon: Camera, title: "Screenshots", text: "Capture context fast with annotations and a clean viewer experience." },
  { icon: Bot, title: "ClipAI notes", text: "Generate titles, chapters, summaries, and lightweight SOPs from recordings." }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-ink">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-black"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#625df5] text-white">C</span>ClipAI</Link>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
            <a href="#features">Features</a>
            <a href="#teams">Teams</a>
            <Link href="/pricing">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost">Log in</Button></Link>
            <Link href="/signup"><Button>Try free</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl items-center gap-10 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d9d7ff] bg-white px-3 py-2 text-sm font-bold text-[#4842d8]"><Sparkles className="h-4 w-4" /> Async video for teams</p>
          <h1 className="max-w-2xl text-5xl font-black leading-[1.02] tracking-normal md:text-7xl">Video that moves work forward</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">Record in a few clicks, share anywhere, and keep every project moving with comments, reactions, AI summaries, and instant links.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup"><Button className="h-12 px-5"><Play className="h-4 w-4" />Try ClipAI for free</Button></Link>
            <Link href="/login"><Button variant="secondary" className="h-12 px-5"><ScreenShare className="h-4 w-4" />Open recorder</Button></Link>
          </div>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-[#171923] shadow-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 bg-[#222637] px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
              <span className="h-3 w-3 rounded-full bg-[#ffd166]" />
              <span className="h-3 w-3 rounded-full bg-[#06d6a0]" />
              <span className="ml-3 text-sm font-semibold text-white/70">Sprint demo - Product team</span>
            </div>
            <div className="relative aspect-video bg-[linear-gradient(135deg,#24293f,#625df5_48%,#00b8a9)] p-6">
              <div className="grid h-full grid-cols-[1fr_210px] gap-4">
                <div className="rounded-lg bg-white p-4 shadow-xl">
                  <div className="mb-4 h-8 w-40 rounded bg-slate-200" />
                  <div className="grid gap-3">
                    <div className="h-16 rounded bg-[#e8f5f3]" />
                    <div className="h-16 rounded bg-[#eef0ff]" />
                    <div className="h-16 rounded bg-[#fff1e8]" />
                  </div>
                </div>
                <div className="rounded-lg bg-white/95 p-4 shadow-xl">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-[#625df5]" />AI summary</div>
                  <div className="space-y-2">
                    <div className="h-3 rounded bg-slate-200" />
                    <div className="h-3 rounded bg-slate-200" />
                    <div className="h-3 w-2/3 rounded bg-slate-200" />
                  </div>
                  <button className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-md bg-[#625df5] text-sm font-bold text-white"><MousePointerClick className="h-4 w-4" />Copy link</button>
                </div>
              </div>
              <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-xl">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ff775c] text-sm font-black text-white">You</span>
                <span className="h-3 w-28 rounded bg-slate-200" />
                <span className="h-3 w-12 rounded bg-[#ff775c]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-3xl font-black">Much more than a screen recorder</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {features.map((feature) => <article key={feature.title} className="rounded-lg border border-slate-200 p-5"><feature.icon className="mb-5 h-6 w-6 text-[#625df5]" /><h3 className="font-black">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{feature.text}</p></article>)}
          </div>
        </div>
      </section>

      <section id="teams" className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {["Engineering demos", "Sales walkthroughs", "Product updates"].map((item) => <div key={item} className="flex items-center gap-3 text-lg font-black"><CheckCircle2 className="h-6 w-6 text-[#00a889]" />{item}</div>)}
        </div>
      </section>
    </main>
  );
}
