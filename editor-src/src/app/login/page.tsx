"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/editor";
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const res = await fetch(`/editor/api/auth/${mode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      router.push(next.startsWith("/editor") ? next : "/editor");
      router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Request failed"); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-950 text-neutral-100 p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-xl border border-neutral-800 bg-neutral-900 p-7 shadow-2xl">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold tracking-tight">fas.lol <span className="text-neutral-500">Studio</span></div>
          <p className="text-xs text-neutral-400">Video creative editor</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-neutral-800 p-1 text-xs">
          {(["login", "register"] as const).map((m) => (
            <button type="button" key={m} onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 rounded-md py-1.5 ${mode === m ? "bg-neutral-700 text-white" : "text-neutral-400"}`}>
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>
        {mode === "register" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required
            className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500" />
        )}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 8)" required minLength={8}
          className="w-full rounded-md border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-neutral-500" />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-white py-2 text-sm font-semibold text-neutral-900 disabled:opacity-50">
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
