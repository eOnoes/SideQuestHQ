import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PUT(_req: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { index } = await params;
  const db = getDb();
  const r = db.prepare("SELECT * FROM people WHERE id = ?").get(parseInt(index, 10)) as any;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const states = ["Active", "Waiting", "Quiet"];
  const next = states[(states.indexOf(r.status) + 1) % states.length];
  db.prepare("UPDATE people SET status = ? WHERE id = ?").run(next, r.id);
  return NextResponse.json({ ...r, status: next });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ index: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { index } = await params;
  const db = getDb();
  db.prepare("DELETE FROM people WHERE id = ?").run(parseInt(index, 10));
  return NextResponse.json({ success: true });
}
