import { NextRequest, NextResponse } from "next/server";
import { userFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = userFromRequest(req);
  return user ? NextResponse.json({ user }) : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
