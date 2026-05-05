"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { CircleDot } from "lucide-react";
import { Button } from "@/components/Button";
import { login } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { setSession, hydrate } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => hydrate(), [hydrate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await login({ email, password });
      setSession(session.token, session.user);
      router.push("/dashboard");
    } catch {
      setError("Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cloud px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-xl font-bold"><CircleDot className="h-6 w-6 text-brand" />ClipAI</div>
        <label className="mb-3 block text-sm font-medium">Email<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label className="mb-4 block text-sm font-medium">Password<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        {error && <p className="mb-3 text-sm text-coral">{error}</p>}
        <Button className="w-full" disabled={loading}>{loading ? "Signing in" : "Sign in"}</Button>
        <p className="mt-4 text-center text-sm text-slate-500">New here? <Link className="font-semibold text-brand" href="/signup">Create an account</Link></p>
      </form>
    </main>
  );
}

