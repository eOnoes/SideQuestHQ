import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/chat?session_id=... — get messages for a session
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("session_id") || "default";
  const db = getDb();
  const rows = db.prepare("SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC").all(sessionId) as any[];
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    session_id: r.session_id,
    role: r.role === "scout" ? "cyony" : r.role,
    text: r.text,
    timestamp: r.timestamp,
  })));
}

// POST /api/chat — add message to a session
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const sessionId = body.session_id || "default";
  const now = Date.now();
  const msg = {
    id: uid("chat"),
    session_id: sessionId,
    role: body.role || "user",
    text: body.text || "",
    timestamp: now,
  };

  db.prepare("INSERT INTO chat_messages (id, session_id, role, text, timestamp) VALUES (?, ?, ?, ?, ?)").run(
    msg.id, msg.session_id, msg.role, msg.text, msg.timestamp
  );

  // Update session's updated_at and auto-title from first user message
  db.prepare("UPDATE chat_sessions SET updated_at = ? WHERE id = ?").run(now, sessionId);
  
  // Auto-title: if session title is "New Chat" and this is a user message, use first 40 chars
  if (body.role === "user") {
    const sess = db.prepare("SELECT title FROM chat_sessions WHERE id = ?").get(sessionId) as any;
    if (sess && sess.title === "New Chat") {
      const title = body.text.slice(0, 40) + (body.text.length > 40 ? "..." : "");
      db.prepare("UPDATE chat_sessions SET title = ? WHERE id = ?").run(title, sessionId);
    }
  }

  return NextResponse.json(msg, { status: 201 });
}

// DELETE /api/chat?session_id=... — clear messages for a session
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("session_id");
  const db = getDb();
  
  if (sessionId) {
    db.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(sessionId);
    db.prepare("UPDATE chat_sessions SET archived = 1 WHERE id = ?").run(sessionId);
  } else {
    db.prepare("DELETE FROM chat_messages").run();
  }
  return NextResponse.json({ success: true });
}
