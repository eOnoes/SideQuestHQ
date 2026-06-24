import { NextRequest, NextResponse } from "next/server";
import { getDb, jsonParse } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const { note } = await req.json();
  if (!note?.trim()) return NextResponse.json({ error: "Note required" }, { status: 400 });

  const db = getDb();
  const decodedName = decodeURIComponent(name);
  const r = db.prepare("SELECT notes_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const notes = jsonParse<string[]>(r.notes_json, []);
  notes.push(note.trim());

  db.prepare("UPDATE quests SET notes_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(notes), decodedName);
  return NextResponse.json({ notes }, { status: 201 });
}
