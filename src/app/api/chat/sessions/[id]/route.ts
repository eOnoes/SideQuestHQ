import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

// PUT /api/chat/sessions/:id — archive or delete a session
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { archived } = await req.json();
  const db = getDb();
  db.prepare("UPDATE chat_sessions SET archived = ? WHERE id = ?").run(archived ? 1 : 0, id);
  return NextResponse.json({ ok: true });
}

// DELETE /api/chat/sessions/:id — permanently delete session + messages
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM chat_messages WHERE session_id = ?").run(id);
  db.prepare("DELETE FROM chat_sessions WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
