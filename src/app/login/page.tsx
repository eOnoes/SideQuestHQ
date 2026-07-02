"use client";

import { useAuth } from "../../lib/auth";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [hasPasskey, setHasPasskey] = useState<boolean | null>(null);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);

  useEffect(() => {
    if (!loading && user && !showPasskeyPrompt) {
      router.replace("/app");
    }
  }, [user, loading, router, showPasskeyPrompt]);

  useEffect(() => {
    if (loading || user) return;

    fetch("/api/auth/passkey/login/options")
      .then(async (response) => {
        const result = await response.json();
        setHasPasskey(response.ok ? Boolean(result.hasPasskeys) : null);
      })
      .catch(() => {
        setHasPasskey(null);
      });
  }, [loading, user]);

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>SQ</div>
          <h1>SideQuest HQ</h1>
          <p className="muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && !showPasskeyPrompt) {
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError("Password required");
      return;
    }

    setSubmitting(true);
    setError(null);

    const signInError = await signIn(trimmedPassword);
    setSubmitting(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    setPassword("");
    setShowPasskeyPrompt(true);
  }

  async function handlePasskeyLogin() {
    if (!window.PublicKeyCredential) {
      setError("Passkeys are not supported in this browser");
      return;
    }

    if (hasPasskey === false) {
      setError("Enter your password first, then save a passkey");
      return;
    }

    setPasskeyBusy(true);
    setError(null);

    try {
      const optionsResponse = await fetch("/api/auth/passkey/login/options", { method: "POST" });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) {
        throw new Error(options.error || "No passkey available");
      }

      const credential = await startAuthentication({ optionsJSON: options });
      const verifyResponse = await fetch("/api/auth/passkey/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok || !result.success) {
        throw new Error(result.error || "Passkey login failed");
      }

      router.replace("/app");
    } catch (err: any) {
      setError(err.message || "Passkey login failed");
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function handleRegisterPasskey() {
    if (!window.PublicKeyCredential) {
      setError("Passkeys are not supported in this browser");
      return;
    }

    setPasskeyBusy(true);
    setError(null);

    try {
      const optionsResponse = await fetch("/api/auth/passkey/register/options", { method: "POST" });
      const options = await optionsResponse.json();
      if (!optionsResponse.ok) {
        throw new Error(options.error || "Could not start passkey setup");
      }

      const credential = await startRegistration({ optionsJSON: options });
      const verifyResponse = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential),
      });
      const result = await verifyResponse.json();
      if (!verifyResponse.ok || !result.success) {
        throw new Error(result.error || "Passkey setup failed");
      }

      router.replace("/app");
    } catch (err: any) {
      setError(err.message || "Passkey setup failed");
    } finally {
      setPasskeyBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>SQ</div>
        <h1>SideQuest HQ</h1>
        <p className="muted">Your private command center</p>
        {showPasskeyPrompt ? (
          <div className="passkey-prompt">
            <p>Save passkey for faster login?</p>
            <div className="passkey-actions">
              <button
                className="primary-button"
                disabled={passkeyBusy}
                onClick={handleRegisterPasskey}
                type="button"
              >
                {passkeyBusy ? "Opening..." : "Yes"}
              </button>
              <button
                className="passkey-secondary"
                disabled={passkeyBusy}
                onClick={() => router.replace("/app")}
                type="button"
              >
                Not now
              </button>
            </div>
          </div>
        ) : null}
        {!showPasskeyPrompt ? (
          <>
            <button
              className="passkey-button"
              disabled={passkeyBusy || submitting}
              onClick={handlePasskeyLogin}
              type="button"
            >
              <span aria-hidden="true">◉</span>
              {passkeyBusy ? "Opening..." : hasPasskey === false ? "Set up passkey" : "Use passkey"}
            </button>
            <div className="login-divider"><span>or</span></div>
          </>
        ) : null}
        <input
          aria-label="Password"
          autoComplete="current-password"
          autoFocus
          disabled={showPasskeyPrompt}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />
        {error ? (
          <p className="login-message" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="primary-button"
          disabled={submitting}
          style={{ border: "none", marginTop: 24, minWidth: 160 }}
          type="submit"
        >
          {submitting ? "Checking..." : "Enter HQ"}
        </button>
        <p className="muted" style={{ marginTop: 20, fontSize: 11, opacity: 0.5 }}>
          All data stays on this device. No accounts, no cloud.
        </p>
      </form>
    </div>
  );
}
