import { NextRequest, NextResponse } from "next/server";
import { createSession, db, SESSION_COOKIE, sessionCookieOptions, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();
    const row = db().prepare("SELECT id,email,name,password_hash FROM users WHERE email=?").get(normalized) as
      | { id: string; email: string; name: string; password_hash: string }
      | undefined;
    if (!row || !verifyPassword(String(password || ""), row.password_hash))
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    const res = NextResponse.json({ user: { id: row.id, email: row.email, name: row.name } });
    res.cookies.set(SESSION_COOKIE, createSession(row.id), sessionCookieOptions);
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
