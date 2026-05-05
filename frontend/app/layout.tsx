import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ClipAI",
  description: "Secure async video recording and sharing"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

