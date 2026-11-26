import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSession, db, hashPassword, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    const normalized = String(email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (typeof password !== "string" || password.length < 8)
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    const existing = db().prepare("SELECT id FROM users WHERE email=?").get(normalized);
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const id = randomUUID();
    db().prepare("INSERT INTO users(id,email,name,password_hash,created_at) VALUES(?,?,?,?,?)")
      .run(id, normalized, String(name || normalized.split("@")[0]).slice(0, 80), hashPassword(password), new Date().toISOString());
    const res = NextResponse.json({ user: { id, email: normalized, name: name || normalized.split("@")[0] } });
    res.cookies.set(SESSION_COOKIE, createSession(id), sessionCookieOptions);
    return res;
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Bad request" }, { status: 400 });
  }
}
