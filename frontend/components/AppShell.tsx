"use client";

import Link from "next/link";
import { LogOut, Video, CreditCard, LayoutDashboard, CircleDot, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/store/auth-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-cloud">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-black">
            <CircleDot className="h-6 w-6 text-[#625df5]" /> ClipAI
          </Link>
          <nav className="flex items-center gap-2">
            <Link className="rounded-md px-3 py-2 text-sm hover:bg-slate-100" href="/dashboard"><LayoutDashboard className="mr-1 inline h-4 w-4" />Dashboard</Link>
            <Link className="rounded-md px-3 py-2 text-sm hover:bg-slate-100" href="/record"><Video className="mr-1 inline h-4 w-4" />Record</Link>
            <span className="hidden rounded-full bg-[#eef0ff] px-3 py-2 text-sm font-bold text-[#625df5] md:inline-flex"><Sparkles className="mr-1 h-4 w-4" />AI notes</span>
            <Link className="rounded-md px-3 py-2 text-sm hover:bg-slate-100" href="/pricing"><CreditCard className="mr-1 inline h-4 w-4" />Pricing</Link>
            <span className="hidden text-sm text-slate-500 md:inline">{user?.displayName}</span>
            <Button
              variant="ghost"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
