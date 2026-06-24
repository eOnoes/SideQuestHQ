import { NextRequest, NextResponse } from "next/server";
import { getDb, jsonParse } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ name: string; index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, index: idxStr } = await params;
  const db = getDb();
  const decodedName = decodeURIComponent(name);
  const idx = parseInt(idxStr, 10);

  const r = db.prepare("SELECT papers_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const papers = jsonParse<any[]>(r.papers_json, []);
  if (!papers[idx]) return NextResponse.json({ error: "Index out of bounds" }, { status: 400 });

  const states = ["Draft", "Review", "Ready", "Filed"];
  const next = states[(states.indexOf(papers[idx].state) + 1) % states.length];
  papers[idx] = { ...papers[idx], state: next };

  db.prepare("UPDATE quests SET papers_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(papers), decodedName);
  return NextResponse.json({ papers });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string; index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, index: idxStr } = await params;
  const db = getDb();
  const decodedName = decodeURIComponent(name);
  const idx = parseInt(idxStr, 10);

  const r = db.prepare("SELECT papers_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const papers = jsonParse<any[]>(r.papers_json, []).filter((_: any, i: number) => i !== idx);
  db.prepare("UPDATE quests SET papers_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(papers), decodedName);
  return NextResponse.json({ papers });
}
