import { NextRequest, NextResponse } from "next/server";
import { getDb, uid } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/chat/sessions — list all sessions (most recent first)
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare(`
    SELECT s.*, 
      (SELECT COUNT(*) FROM chat_messages m WHERE m.session_id = s.id) as message_count,
      (SELECT text FROM chat_messages m WHERE m.session_id = s.id ORDER BY m.timestamp DESC LIMIT 1) as last_message
    FROM chat_sessions s
    WHERE s.archived = 0
    ORDER BY s.updated_at DESC
  `).all() as any[];

  return NextResponse.json(rows.map(r => ({
    id: r.id,
    title: r.title,
    created_at: r.created_at,
    updated_at: r.updated_at,
    message_count: r.message_count,
    last_message: r.last_message || null,
  })));
}

// POST /api/chat/sessions — create new session
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = getDb();
  const now = Date.now();
  const sess = {
    id: uid("sess"),
    title: body.title || "New Chat",
    created_at: now,
    updated_at: now,
    archived: 0,
  };

  db.prepare("INSERT INTO chat_sessions (id, title, created_at, updated_at, archived) VALUES (?, ?, ?, ?, ?)").run(
    sess.id, sess.title, sess.created_at, sess.updated_at, sess.archived
  );
  return NextResponse.json(sess, { status: 201 });
}
