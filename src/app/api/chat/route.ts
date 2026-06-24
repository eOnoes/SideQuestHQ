import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM chat_messages ORDER BY timestamp ASC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    id: r.id, role: r.role, text: r.text, timestamp: r.timestamp,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const msg = {
    id: uid("chat"),
    role: body.role || "user",
    text: body.text || "",
    timestamp: Date.now(),
  };

  db.prepare("INSERT INTO chat_messages (id, role, text, timestamp) VALUES (?, ?, ?, ?)").run(
    msg.id, msg.role, msg.text, msg.timestamp
  );
  return NextResponse.json(msg, { status: 201 });
}

export async function DELETE() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  db.prepare("DELETE FROM chat_messages").run();
  return NextResponse.json({ success: true });
}
