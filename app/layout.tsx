import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Augnes",
  description: "Temporal state runtime cockpit",
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
