import { NextRequest, NextResponse } from "next/server";
import { getDb, jsonParse, uid } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db.prepare("SELECT * FROM quests ORDER BY created_at DESC").all() as any[];
  
  const quests = rows.map(r => ({
    name: r.name,
    type: r.type,
    status: r.status,
    nextMove: r.next_move,
    value: r.value,
    progress: r.progress,
    tone: r.tone,
    owner: r.owner,
    target: r.target,
    due: r.due,
    summary: r.summary,
    ledger: jsonParse(r.ledger_json, []),
    papers: jsonParse(r.papers_json, []),
    steps: jsonParse(r.steps_json, []),
    notes: jsonParse(r.notes_json, []),
  }));

  return NextResponse.json(quests);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const db = getDb();
  const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const quest = {
    name: body.name || uid("quest"),
    type: body.type || "",
    status: body.status || "",
    next_move: body.nextMove || "Define the first move.",
    value: body.value || "$0",
    progress: body.progress || 0,
    tone: body.tone || "discovery",
    owner: body.owner || "",
    target: body.target || "",
    due: body.due || `Created ${now}`,
    summary: body.summary || "",
    ledger_json: JSON.stringify([]),
    papers_json: JSON.stringify([]),
    steps_json: JSON.stringify([
      { label: "Quest created", state: "Done" },
      { label: "First task", state: "Now" },
      { label: "Complete", state: "Next" },
    ]),
    notes_json: JSON.stringify([]),
  };

  db.prepare(`INSERT INTO quests (name, type, status, next_move, value, progress, tone, owner, target, due, summary, ledger_json, papers_json, steps_json, notes_json)
    VALUES (@name, @type, @status, @next_move, @value, @progress, @tone, @owner, @target, @due, @summary, @ledger_json, @papers_json, @steps_json, @notes_json)`).run(quest);

  return NextResponse.json({
    ...body,
    nextMove: quest.next_move,
    ledger: [],
    papers: [],
    steps: jsonParse(quest.steps_json, []),
    notes: [],
  }, { status: 201 });
}
