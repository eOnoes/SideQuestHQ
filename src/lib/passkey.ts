import type { WebAuthnCredential } from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

export {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";

export const passkeyConfig = {
  rpName: "SideQuest HQ",
  rpID: process.env.WEBAUTHN_RP_ID || "localhost",
  origin: process.env.WEBAUTHN_ORIGIN || "http://localhost:3456",
};

export type PasskeyRow = {
  id: string;
  user_id: string;
  public_key: string;
  counter: number;
  created_at: string;
};

export function encodePublicKey(publicKey: WebAuthnCredential["publicKey"]): string {
  return isoBase64URL.fromBuffer(publicKey);
}

export function toWebAuthnCredential(passkey: PasskeyRow): WebAuthnCredential {
  return {
    id: passkey.id,
    publicKey: isoBase64URL.toBuffer(passkey.public_key),
    counter: passkey.counter,
  };
}
