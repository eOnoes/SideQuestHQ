import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM global_documents ORDER BY created_at DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    vendor: r.vendor,
    detail: r.detail,
    amount: r.amount,
    date: r.date,
    category: r.category,
    badge: r.badge,
    badge_color: r.badge_color,
    receipt_url: r.receipt_url,
    notes: r.notes,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO global_documents (vendor, detail, amount, date, category, badge, badge_color, receipt_url, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    body.vendor || "",
    body.detail || "",
    body.amount || "$0",
    body.date || "",
    body.category || "uncategorized",
    body.badge || "manual",
    body.badge_color || "manual",
    body.receipt_url || "",
    body.notes || "",
  );
  return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
}
