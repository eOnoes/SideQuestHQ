import { NextRequest, NextResponse } from "next/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  encodePublicKey,
  passkeyConfig,
  verifyRegistrationResponse,
} from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.userId !== "eddie") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.currentChallenge) {
    return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
  }

  const response = (await req.json()) as RegistrationResponseJSON;
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: session.currentChallenge,
    expectedOrigin: passkeyConfig.origin,
    expectedRPID: passkeyConfig.rpID,
    requireUserVerification: true,
  });

  session.currentChallenge = undefined;
  await session.save();

  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey registration failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  const db = getDb();
  db.prepare(
    "INSERT OR REPLACE INTO passkeys (id, user_id, public_key, counter) VALUES (?, ?, ?, ?)"
  ).run(credential.id, session.userId, encodePublicKey(credential.publicKey), credential.counter);

  return NextResponse.json({ success: true });
}
