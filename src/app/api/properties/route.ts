import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM rental_properties ORDER BY created_at DESC").all() as any[];
  return NextResponse.json(rows.map(r => ({
    property_id: r.property_id,
    property_name: r.property_name,
    street_address: r.street_address,
    city: r.city,
    state: r.state,
    zip: r.zip,
    rent_type: r.rent_type,
    rooms: r.rooms,
    pet_allowed: r.pet_allowed,
    acquisition_date: r.acquisition_date,
    ownership_status: r.ownership_status,
    rental_status: r.rental_status,
    notes: r.notes,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const uid = `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const result = db.prepare(
    `INSERT INTO rental_properties (property_id, property_name, street_address, city, state, zip, rent_type, rooms, pet_allowed, acquisition_date, ownership_status, rental_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uid,
    body.property_name || "",
    body.street_address || "",
    body.city || "",
    body.state || "",
    body.zip || "",
    body.rent_type || "House",
    body.rooms || 0,
    body.pet_allowed ? 1 : 0,
    body.acquisition_date || "",
    body.ownership_status || "owned",
    body.rental_status || "available",
    body.notes || "",
  );
  return NextResponse.json({ property_id: uid, ...body }, { status: 201 });
}
