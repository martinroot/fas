import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, userFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = db().prepare("SELECT id,name,updated_at FROM projects WHERE user_id=? ORDER BY updated_at DESC")
    .all(user.id);
  return NextResponse.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, data } = await req.json();
    if (!data || typeof data !== "object")
      return NextResponse.json({ error: "Project data is required" }, { status: 400 });
    const id = randomUUID();
    const now = new Date().toISOString();
    db().prepare("INSERT INTO projects(id,user_id,name,data,updated_at) VALUES(?,?,?,?,?)")
      .run(id, user.id, String(name || "Untitled").slice(0, 120), JSON.stringify(data), now);
    return NextResponse.json({ project: { id, name: name || "Untitled", updated_at: now } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 });
  }
}
