"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { CircleDot } from "lucide-react";
import { Button } from "@/components/Button";
import { signup } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const [form, setForm] = useState({ displayName: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const session = await signup(form);
      setSession(session.token, session.user);
      router.push("/record");
    } catch {
      setError("Could not create this account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-cloud px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2 text-xl font-bold"><CircleDot className="h-6 w-6 text-brand" />ClipAI</div>
        <label className="mb-3 block text-sm font-medium">Name<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required /></label>
        <label className="mb-3 block text-sm font-medium">Email<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required /></label>
        <label className="mb-4 block text-sm font-medium">Password<input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" minLength={8} required /></label>
        {error && <p className="mb-3 text-sm text-coral">{error}</p>}
        <Button className="w-full" disabled={loading}>{loading ? "Creating" : "Create account"}</Button>
        <p className="mt-4 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-brand" href="/login">Sign in</Link></p>
      </form>
    </main>
  );
}

