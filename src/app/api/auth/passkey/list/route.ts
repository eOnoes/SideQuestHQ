import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { PasskeyRow } from "@/lib/passkey";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const passkeys = db
    .prepare("SELECT id, user_id, public_key, counter, created_at FROM passkeys WHERE user_id = ? ORDER BY created_at DESC")
    .all(session.userId) as PasskeyRow[];

  return NextResponse.json({
    passkeys: passkeys.map((passkey) => ({
      id: passkey.id,
      createdAt: passkey.created_at,
    })),
  });
}
