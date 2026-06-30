import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

// POST — log a snooze event
export async function POST(req: NextRequest) {
  try {
    const { label, quest } = await req.json();
    if (!label) {
      return NextResponse.json({ error: "label required" }, { status: 400 });
    }
    const db = getDb();
    db.prepare(
      "INSERT INTO snooze_log (reminder_label, reminder_quest) VALUES (?, ?)"
    ).run(label, quest || "");
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — fetch unacknowledged snoozes (for Hermes cron polling)
export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT id, reminder_label, reminder_quest, snoozed_at FROM snooze_log WHERE acknowledged = 0 ORDER BY snoozed_at DESC"
      )
      .all();
    return NextResponse.json({ snoozes: rows, count: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — acknowledge snoozes (mark as seen by Cyony)
export async function PATCH() {
  try {
    const db = getDb();
    db.prepare("UPDATE snooze_log SET acknowledged = 1 WHERE acknowledged = 0").run();
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
