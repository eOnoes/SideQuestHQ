import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM people ORDER BY id DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    name: r.name, role: r.role, quest: r.quest,
    nextTouch: r.next_touch, status: r.status,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const result = db.prepare("INSERT INTO people (name, role, quest, next_touch, status) VALUES (?, ?, ?, ?, ?)").run(
    body.name || "", body.role || "", body.quest || "", body.nextTouch || "", body.status || "Active"
  );
  return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
}
