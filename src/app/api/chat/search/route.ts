import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/chat/search?q=... — search across all chat messages
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json([]);

  const db = getDb();
  const rows = db.prepare(`
    SELECT m.*, s.title as session_title
    FROM chat_messages m
    LEFT JOIN chat_sessions s ON m.session_id = s.id
    WHERE m.text LIKE ?
    ORDER BY m.timestamp DESC
    LIMIT 50
  `).all(`%${q}%`) as any[];

  return NextResponse.json(rows.map(r => ({
    id: r.id,
    session_id: r.session_id,
    session_title: r.session_title || "New Chat",
    role: r.role,
    text: r.text,
    timestamp: r.timestamp,
  })));
}
