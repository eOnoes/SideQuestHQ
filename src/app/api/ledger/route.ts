import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM global_ledger ORDER BY created_at DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    detail: r.detail,
    amount: r.amount,
    date: r.date,
    type: r.type,
    section: r.section,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO global_ledger (name, detail, amount, date, type, section)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    body.name || "",
    body.detail || "",
    body.amount || "$0",
    body.date || "",
    body.type || "neutral",
    body.section || "uncategorized",
  );
  return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
}
