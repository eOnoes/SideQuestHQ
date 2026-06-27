import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM contacts ORDER BY created_at DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    id: r.id,
    name: r.name,
    contact_type: r.contact_type,
    phone: r.phone,
    relation: r.relation,
    note: r.note,
    category: r.category,
    subcategory: r.subcategory,
    bar_color: r.bar_color,
    details: JSON.parse(r.details_json || "{}"),
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const result = db.prepare(
    `INSERT INTO contacts (name, contact_type, phone, relation, note, category, subcategory, bar_color, details_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    body.name || "",
    body.contact_type || "cell",
    body.phone || "",
    body.relation || "",
    body.note || "",
    body.category || "general",
    body.subcategory || "",
    body.bar_color || "green",
    JSON.stringify(body.details || {}),
  );
  return NextResponse.json({ id: result.lastInsertRowid, ...body }, { status: 201 });
}
