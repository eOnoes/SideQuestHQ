import { NextRequest, NextResponse } from "next/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  passkeyConfig,
  toWebAuthnCredential,
  type PasskeyRow,
  verifyAuthenticationResponse,
} from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.currentChallenge) {
    return NextResponse.json({ error: "Missing challenge" }, { status: 400 });
  }

  const response = (await req.json()) as AuthenticationResponseJSON;
  const db = getDb();
  const passkey = db.prepare("SELECT * FROM passkeys WHERE id = ?").get(response.id) as PasskeyRow | undefined;
  if (!passkey) {
    session.currentChallenge = undefined;
    await session.save();
    return NextResponse.json({ error: "Unknown passkey" }, { status: 404 });
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: session.currentChallenge,
    expectedOrigin: passkeyConfig.origin,
    expectedRPID: passkeyConfig.rpID,
    credential: toWebAuthnCredential(passkey),
    requireUserVerification: true,
  });

  session.currentChallenge = undefined;

  if (!verification.verified) {
    await session.save();
    return NextResponse.json({ error: "Passkey login failed" }, { status: 401 });
  }

  db.prepare("UPDATE passkeys SET counter = ? WHERE id = ?").run(
    verification.authenticationInfo.newCounter,
    passkey.id
  );

  session.userId = passkey.user_id;
  session.isLoggedIn = true;
  await session.save();

  return NextResponse.json({ success: true, name: "Eddie" });
}
