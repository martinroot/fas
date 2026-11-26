import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";

export async function DELETE(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { src } = await req.json();
  if (typeof src !== "string") return NextResponse.json({ error: "src is required" }, { status: 400 });
  const key = decodeURIComponent(new URL(src, "http://local").pathname.split("/editor/media/")[1] || "");
  if (!key.startsWith(`${user.id}/`) || !/^[a-zA-Z0-9_./-]+$/.test(key) || key.includes(".."))
    return NextResponse.json({ error: "Invalid src" }, { status: 400 });
  const dir = process.env.FAS_MEDIA_DIR || "/var/lib/fas-editor/media";
  await unlink(path.join(dir, key)).catch(() => undefined);
  return NextResponse.json({ success: true });
}
