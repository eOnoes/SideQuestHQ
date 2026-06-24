import { NextRequest, NextResponse } from "next/server";
import { getDb, jsonParse } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest, { params }: { params: Promise<{ name: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await params;
  const body = await req.json();
  const db = getDb();
  const decodedName = decodeURIComponent(name);

  const r = db.prepare("SELECT ledger_json FROM quests WHERE name = ?").get(decodedName) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ledger = jsonParse<any[]>(r.ledger_json, []);
  ledger.push({ label: body.label || "", amount: body.amount || "$0", state: body.state || "Draft" });

  db.prepare("UPDATE quests SET ledger_json = ?, updated_at = datetime('now') WHERE name = ?").run(JSON.stringify(ledger), decodedName);
  return NextResponse.json({ ledger }, { status: 201 });
}
