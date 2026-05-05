"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth-store";

export function Protected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, hydrated, hydrate } = useAuthStore();

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (hydrated && !token) {
      router.replace("/login");
    }
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return <main className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading</main>;
  }

  return <>{children}</>;
}

