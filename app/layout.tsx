import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Augnes",
  description: "Local project continuity, evidence, and review",
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
