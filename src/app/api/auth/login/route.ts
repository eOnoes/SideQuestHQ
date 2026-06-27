import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getSession } from "@/lib/session";
import bcrypt from "bcryptjs";

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

  // Verify password with bcrypt
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true, name: user.name });
}
