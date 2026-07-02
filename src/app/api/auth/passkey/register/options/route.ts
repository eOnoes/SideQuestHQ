import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import { generateRegistrationOptions, passkeyConfig, type PasskeyRow } from "@/lib/passkey";

export async function POST() {
  const session = await getSession();
  if (!session.isLoggedIn || session.userId !== "eddie") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const passkeys = db.prepare("SELECT * FROM passkeys WHERE user_id = ?").all(session.userId) as PasskeyRow[];
  const options = await generateRegistrationOptions({
    rpName: passkeyConfig.rpName,
    rpID: passkeyConfig.rpID,
    userID: new TextEncoder().encode(session.userId),
    userName: session.userId,
    userDisplayName: "Eddie",
    timeout: 60_000,
    attestationType: "none",
    excludeCredentials: passkeys.map((passkey) => ({ id: passkey.id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
  });

  session.currentChallenge = options.challenge;
  await session.save();

  return NextResponse.json(options);
}
