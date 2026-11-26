"use client";
import { useEffect, useState } from "react";
import Editor from "@/components/editor/editor";
import { core } from "@/lib/project";
import { useProjectStore } from "@/stores/project-store";

export default function Page() {
  const [ready, setReady] = useState(false);
  const { setProjectName, setProjectId } = useProjectStore();

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    if (!id) { setReady(true); return; }
    fetch(`/editor/api/projects/${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.project?.data) {
          setProjectName(data.project.name);
          setProjectId(data.project.id);
          core.project.import(data.project.data);
        }
      })
      .catch(console.error)
      .finally(() => setReady(true));
  }, [setProjectName, setProjectId]);

  if (!ready) return <div className="flex h-screen items-center justify-center bg-neutral-950 text-sm text-neutral-400">Loading project…</div>;
  return <Editor />;
}
