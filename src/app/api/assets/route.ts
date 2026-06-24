import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM assets ORDER BY id DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    name: r.name, type: r.type, value: r.value,
    projected: r.projected, frequency: r.frequency, status: r.status,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const result = db.prepare("INSERT INTO assets (name, type, value, projected, frequency, status) VALUES (?, ?, ?, ?, ?, ?)").run(
    body.name || "", body.type || "Other", body.value || "$0", body.projected || "", body.frequency || "One-time", body.status || "Planning"
  );
  return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
}
