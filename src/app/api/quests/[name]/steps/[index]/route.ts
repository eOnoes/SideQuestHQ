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

  const r = db.prepare("SELECT steps_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const steps = jsonParse<Array<{ label: string; state: string }>>(r.steps_json, []);
  if (!steps[idx]) return NextResponse.json({ error: "Index out of bounds" }, { status: 400 });

  const order = ["Next", "Now", "Done"];
  const next = order[(order.indexOf(steps[idx].state) + 1) % order.length];
  steps[idx] = { ...steps[idx], state: next };

  db.prepare("UPDATE quests SET steps_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(steps), decodedName);
  return NextResponse.json({ steps });
}
