import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";

const MAX_BYTES = 200 * 1024 * 1024;

export async function PUT(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const key = req.nextUrl.searchParams.get("key") || "";
  if (!key.startsWith(`${user.id}/`) || !/^[a-zA-Z0-9_./-]+$/.test(key) || key.includes(".."))
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > MAX_BYTES)
    return NextResponse.json({ error: "File too large (200 MB max)" }, { status: 413 });
  const dir = process.env.FAS_MEDIA_DIR || "/var/lib/fas-editor/media";
  const dest = path.join(dir, key);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return NextResponse.json({ success: true, size: buf.length });
}
