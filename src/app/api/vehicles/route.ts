import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM vehicles").all() as any[];
  return NextResponse.json(rows.map(r => ({
    vehicle_id: r.vehicle_id,
    vehicle_name: r.vehicle_name,
    vehicle_type: r.vehicle_type,
    make: r.make,
    model: r.model,
    model_year: r.model_year,
    owned_or_leased: r.owned_or_leased,
    availability_status: r.availability_status,
    in_service_date: r.in_service_date,
    lease_monthly_amount: r.lease_monthly_amount,
    start_odometer_year: r.start_odometer_year,
    end_odometer_year: r.end_odometer_year,
    notes: r.notes,
  })));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const uid = `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const result = db.prepare(
    `INSERT INTO vehicles (vehicle_id, vehicle_name, vehicle_type, make, model, model_year, owned_or_leased, availability_status, in_service_date, lease_monthly_amount, start_odometer_year, end_odometer_year, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uid,
    body.vehicle_name || "",
    body.vehicle_type || "Car",
    body.make || "",
    body.model || "",
    body.model_year || "",
    body.owned_or_leased || "owned",
    body.availability_status || "available",
    body.in_service_date || "",
    body.lease_monthly_amount || 0,
    body.start_odometer_year || 0,
    body.end_odometer_year || 0,
    body.notes || "",
  );
  return NextResponse.json({ vehicle_id: uid, ...body }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { vehicle_id, ...fields } = body;
  if (!vehicle_id) return NextResponse.json({ error: "vehicle_id required" }, { status: 400 });

  const db = getDb();
  const setClauses: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`);
    values.push(val);
  }
  if (setClauses.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  values.push(vehicle_id);
  db.prepare(`UPDATE vehicles SET ${setClauses.join(", ")} WHERE vehicle_id = ?`).run(...values);
  return NextResponse.json({ success: true, vehicle_id });
}
