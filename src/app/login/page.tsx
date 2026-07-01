"use client";

import { useAuth } from "../../lib/auth";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginRoute() {
  const { user, loading, signIn } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/app");
    }
  }, [user, loading, router]);

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

  if (user) {
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

    router.replace("/app");
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>SQ</div>
        <h1>SideQuest HQ</h1>
        <p className="muted">Your private command center</p>
        <input
          aria-label="Password"
          autoComplete="current-password"
          autoFocus
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
