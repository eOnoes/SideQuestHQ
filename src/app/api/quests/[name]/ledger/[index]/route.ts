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

  const r = db.prepare("SELECT ledger_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ledger = jsonParse<Array<{ label: string; amount: string; state: string }>>(r.ledger_json, []);
  if (!ledger[idx]) return NextResponse.json({ error: "Index out of bounds" }, { status: 400 });

  const states = ["Draft", "Open", "Paid"];
  const next = states[(states.indexOf(ledger[idx].state) + 1) % states.length];
  ledger[idx] = { ...ledger[idx], state: next };

  db.prepare("UPDATE quests SET ledger_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(ledger), decodedName);
  return NextResponse.json({ ledger });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ name: string; index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, index: idxStr } = await params;
  const db = getDb();
  const decodedName = decodeURIComponent(name);
  const idx = parseInt(idxStr, 10);

  const r = db.prepare("SELECT ledger_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ledger = jsonParse<any[]>(r.ledger_json, []).filter((_: any, i: number) => i !== idx);
  db.prepare("UPDATE quests SET ledger_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(ledger), decodedName);
  return NextResponse.json({ ledger });
}
