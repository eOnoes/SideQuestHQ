import { NextRequest, NextResponse } from "next/server";
import { getDb, jsonParse } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string; index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, index: idxStr } = await params;
  const db = getDb();
  const decodedName = decodeURIComponent(name);
  const idx = parseInt(idxStr, 10);

  const r = db.prepare("SELECT notes_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notes = jsonParse<string[]>(r.notes_json, []).filter((_: any, i: number) => i !== idx);
  db.prepare("UPDATE quests SET notes_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(notes), decodedName);
  return NextResponse.json({ notes });
}
