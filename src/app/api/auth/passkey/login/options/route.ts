import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateAuthenticationOptions, passkeyConfig, type PasskeyRow } from "@/lib/passkey";

export async function GET() {
  const db = getDb();
  const row = db.prepare("SELECT COUNT(*) AS count FROM passkeys WHERE user_id = ?").get("eddie") as {
    count: number;
  };

  return NextResponse.json({ hasPasskeys: row.count > 0 });
}

export async function POST() {
  const db = getDb();
  const passkeys = db.prepare("SELECT * FROM passkeys WHERE user_id = ?").all("eddie") as PasskeyRow[];
  if (passkeys.length === 0) {
    return NextResponse.json({ error: "No passkeys registered" }, { status: 404 });
  }

  const options = await generateAuthenticationOptions({
    rpID: passkeyConfig.rpID,
    allowCredentials: passkeys.map((passkey) => ({ id: passkey.id })),
    timeout: 60_000,
    userVerification: "required",
  });

  const session = await getSession();
  session.currentChallenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
