import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getSession } from "@/lib/session";

// Simple hash matching the one in auth.tsx
function hash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return "h" + Math.abs(h).toString(36);
}

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get("eddie") as any;
  
  if (!user) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  const pwHash = hash(password);
  if (pwHash !== user.password_hash) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true, name: user.name });
}
