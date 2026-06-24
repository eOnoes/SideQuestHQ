"use client";

import dynamic from "next/dynamic";

const AppShell = dynamic(() => import("./app-shell"), { ssr: false });

export default function AppPage() {
  return <AppShell />;
}
