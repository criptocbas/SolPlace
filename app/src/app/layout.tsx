import type { Metadata } from "next";
import Providers from "@/providers/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolPlace — Collaborative Pixel Canvas on Solana",
  description:
    "Place pixels in real-time on a shared 64x64 canvas. Every pixel is an on-chain transaction processed in sub-50ms via MagicBlock Ephemeral Rollups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
