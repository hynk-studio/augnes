import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./continuities.css";

const interLatin = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-continuities-inter",
  display: "swap",
  weight: "100 900",
  style: "normal",
  fallback: [
    "Apple SD Gothic Neo",
    "Noto Sans CJK KR",
    "Malgun Gothic",
    "Segoe UI",
    "system-ui",
    "sans-serif",
  ],
  adjustFontFallback: false,
  preload: true,
});

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
      <body className={interLatin.variable}>{children}</body>
    </html>
  );
}
