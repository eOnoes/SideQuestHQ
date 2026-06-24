"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import "./globals.css";

export default function LoginPage() {
  const { user, loading, signIn, signOut } = useAuth();
  const router = useRouter();

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
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="brand-mark" style={{ width: 48, height: 48, fontSize: 24 }}>SQ</div>
          <h1>SideQuest HQ</h1>
          <p className="muted">Welcome back, boss</p>
          <div style={{ display: "flex", gap: 12, marginTop: 16, justifyContent: "center" }}>
            <button onClick={() => router.push("/app")} className="primary-button" style={{ textDecoration: "none", border: "none", cursor: "pointer" }}>
              Enter HQ
            </button>
            <button onClick={signOut} className="ghost-button">Lock</button>
          </div>
        </div>
      </div>
    );
  }

  async function handleEnter() {
    const error = await signIn("sidequest");
    if (!error) {
      router.push("/app");
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
