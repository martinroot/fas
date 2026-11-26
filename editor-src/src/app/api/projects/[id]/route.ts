import { NextRequest, NextResponse } from "next/server";
import { db, userFromRequest } from "@/lib/auth";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const row = db().prepare("SELECT id,name,data,updated_at FROM projects WHERE id=? AND user_id=?").get(id, user.id) as
    | { id: string; name: string; data: string; updated_at: string }
    | undefined;
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: { ...row, data: JSON.parse(row.data) } });
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const { name, data } = await req.json();
  if (!data || typeof data !== "object")
    return NextResponse.json({ error: "Project data is required" }, { status: 400 });
  const now = new Date().toISOString();
  const result = db().prepare("UPDATE projects SET name=?,data=?,updated_at=? WHERE id=? AND user_id=?")
    .run(String(name || "Untitled").slice(0, 120), JSON.stringify(data), now, id, user.id);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: { id, name, updated_at: now } });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  const result = db().prepare("DELETE FROM projects WHERE id=? AND user_id=?").run(id, user.id);
  if (!result.changes) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
