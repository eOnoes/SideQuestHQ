"use client";

import { useAuth } from "../../lib/auth";
import { useEffect } from "react";

export default function LoginRoute() {
  const { user, loading, signIn } = useAuth();

  useEffect(() => {
    if (!loading && user && typeof window !== "undefined") {
      window.location.href = "/app";
    }
  }, [user, loading]);

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

  async function handleEnter() {
    const error = await signIn("sidequest");
    if (!error && typeof window !== "undefined") {
      window.location.href = "/app";
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>SQ</div>
        <h1>SideQuest HQ</h1>
        <p className="muted">Your private command center</p>
        <button
          onClick={handleEnter}
          className="primary-button"
          style={{ border: "none", marginTop: 24, minWidth: 160 }}
        >
          Enter HQ
        </button>
        <p className="muted" style={{ marginTop: 20, fontSize: 11, opacity: 0.5 }}>
          All data stays on this device. No accounts, no cloud.
        </p>
      </div>
    </div>
  );
}
