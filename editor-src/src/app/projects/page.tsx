"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = { id: string; name: string; updated_at: string };

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<string>("");
  const [error, setError] = useState("");

  async function load() {
    const [me, list] = await Promise.all([
      fetch("/editor/api/auth/me").then((r) => r.json()),
      fetch("/editor/api/projects").then((r) => r.json()),
    ]);
    if (me.error) { router.push("/editor/login"); return; }
    setUser(me.user.name || me.user.email);
    setProjects(list.projects || []);
  }
  useEffect(() => { load(); }, []);

  async function remove(id: string) {
    if (!confirm("Delete this project?")) return;
    await fetch(`/editor/api/projects/${id}`, { method: "DELETE" });
    load();
  }

  async function logout() {
    await fetch("/editor/api/auth/logout", { method: "POST" });
    router.push("/editor/login"); router.refresh();
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">My projects</h1>
            <p className="text-xs text-neutral-500">Signed in as {user}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push("/editor")} className="rounded-md bg-white px-3 py-2 text-xs font-semibold text-neutral-900">New project</button>
            <button onClick={logout} className="rounded-md border border-neutral-700 px-3 py-2 text-xs">Sign out</button>
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {projects.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-800 p-10 text-center text-sm text-neutral-500">No saved projects yet. Open the editor and use Menu → Save to cloud.</p>
        ) : (
          <ul className="space-y-2">
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900 p-4">
                <button className="text-left" onClick={() => router.push(`/editor?project=${p.id}`)}>
                  <div className="text-sm font-medium">{p.name}</div>
                  <div className="text-[11px] text-neutral-500">{new Date(p.updated_at).toLocaleString()}</div>
                </button>
                <button onClick={() => remove(p.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
              </li>
            ))}
          </ul>
        )}
        <a href="/" className="inline-block text-xs text-neutral-500 hover:text-neutral-300">← fas.lol</a>
      </div>
    </main>
  );
}
