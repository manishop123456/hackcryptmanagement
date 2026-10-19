// FILE: src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, JetBrains_Mono } from "next/font/google";

import "./globals.css";

// Same type pair as devclubtrcac.in: Geist for display and body, JetBrains Mono for code.
const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HackCrypt Management System | DevClub TRCAC",
    template: "%s | HackCrypt Management System",
  },
  description:
    "Internal planning and tracking tool for DevClub TRCAC's HackCrypt 2027-28 (8-9 January 2027).",
  applicationName: "HackCrypt Management System",
};

export const viewport: Viewport = {
  themeColor: "#0c0e13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
