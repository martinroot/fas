import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "fas_session";
const SESSION_DAYS = 30;

let _db: DatabaseSync | null = null;
export function db(): DatabaseSync {
  if (_db) return _db;
  const dir = process.env.FAS_DATA_DIR || "/var/lib/fas-editor";
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const d = new DatabaseSync(path.join(dir, "fas.db"));
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
      data TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS projects_user ON projects(user_id, updated_at DESC);
  `);
  _db = d;
  return d;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [kind, salt, hex] = stored.split("$");
    if (kind !== "scrypt" || !salt || !hex) return false;
    const expected = Buffer.from(hex, "hex");
    const actual = scryptSync(password, salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("base64url");
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  db().prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)")
    .run(sha256(token), userId, expires);
  return token;
}

export function deleteSession(token: string) {
  db().prepare("DELETE FROM sessions WHERE token_hash=?").run(sha256(token));
}

export type User = { id: string; email: string; name: string };

export function userFromRequest(req: NextRequest): User | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const row = db().prepare(`
    SELECT u.id, u.email, u.name FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(sha256(token), Date.now()) as User | undefined;
  return row ?? null;
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DAYS * 86400,
};
