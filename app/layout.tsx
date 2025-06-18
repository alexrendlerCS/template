import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Footer } from "@/components/ui/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitCoach Pro - Personal Training Platform",
  description:
    "Professional fitness coaching platform for trainers and clients",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
