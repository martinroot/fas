import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { fileNames } = await req.json();
  if (!Array.isArray(fileNames) || !fileNames.length)
    return NextResponse.json({ error: "fileNames array is required" }, { status: 400 });
  const uploads = fileNames.slice(0, 20).map((original: string) => {
    const clean = String(original).trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const filePath = `${user.id}/${randomUUID()}-${clean}`;
    const ext = clean.split(".").pop()?.toLowerCase() || "";
    const contentType = ({ mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime",
      mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", png: "image/png",
      jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" } as Record<string,string>)[ext]
      || "application/octet-stream";
    return {
      fileName: clean,
      filePath,
      contentType,
      presignedUrl: `/editor/api/uploads/local?key=${encodeURIComponent(filePath)}`,
      url: `/editor/media/${encodeURIComponent(filePath)}`,
    };
  });
  return NextResponse.json({ success: true, uploads });
}
