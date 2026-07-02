import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM reminders ORDER BY id DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    label: r.label, quest: r.quest, due: r.due,
    recurrence: r.recurrence || "one-time",
    priority: r.priority, done: r.done === 1,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const result = db.prepare("INSERT INTO reminders (label, quest, due, recurrence, priority, done) VALUES (?, ?, ?, ?, ?, ?)").run(
    body.label || "", body.quest || "", body.due || "", body.recurrence || "one-time", body.priority || "Normal", body.done ? 1 : 0
  );
  return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
}
