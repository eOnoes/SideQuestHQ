import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SideQuest HQ",
  description: "Private command center for side ventures, reminders, ledger entries, and paper trail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
