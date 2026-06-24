import { NextRequest, NextResponse } from "next/server";
import { getDb, jsonParse } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const db = getDb();
  const r = db.prepare("SELECT * FROM quests WHERE name = ?").get(decodeURIComponent(name)) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    name: r.name, type: r.type, status: r.status, nextMove: r.next_move,
    value: r.value, progress: r.progress, tone: r.tone, owner: r.owner,
    target: r.target, due: r.due, summary: r.summary,
    ledger: jsonParse(r.ledger_json, []), papers: jsonParse(r.papers_json, []),
    steps: jsonParse(r.steps_json, []), notes: jsonParse(r.notes_json, []),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const body = await req.json();
  const db = getDb();

  const existing = db.prepare("SELECT * FROM quests WHERE name = ?").get(decodeURIComponent(name)) as any;
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updates: Record<string, any> = {};
  if (body.type !== undefined) updates.type = body.type;
  if (body.status !== undefined) updates.status = body.status;
  if (body.nextMove !== undefined) updates.next_move = body.nextMove;
  if (body.value !== undefined) updates.value = body.value;
  if (body.progress !== undefined) updates.progress = body.progress;
  if (body.tone !== undefined) updates.tone = body.tone;
  if (body.owner !== undefined) updates.owner = body.owner;
  if (body.target !== undefined) updates.target = body.target;
  if (body.due !== undefined) updates.due = body.due;
  if (body.summary !== undefined) updates.summary = body.summary;

  if (Object.keys(updates).length > 0) {
    const sets = Object.keys(updates).map(k => `${k} = @${k}`).join(", ");
    db.prepare(`UPDATE quests SET ${sets}, updated_at = datetime('now') WHERE name = @name`).run({ ...updates, name: decodeURIComponent(name) });
  }

  const r = db.prepare("SELECT * FROM quests WHERE name = ?").get(decodeURIComponent(name)) as any;
  return NextResponse.json({
    name: r.name, type: r.type, status: r.status, nextMove: r.next_move,
    value: r.value, progress: r.progress, tone: r.tone, owner: r.owner,
    target: r.target, due: r.due, summary: r.summary,
    ledger: jsonParse(r.ledger_json, []), papers: jsonParse(r.papers_json, []),
    steps: jsonParse(r.steps_json, []), notes: jsonParse(r.notes_json, []),
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const db = getDb();
  db.prepare("DELETE FROM quests WHERE name = ?").run(decodeURIComponent(name));
  return NextResponse.json({ success: true });
}
