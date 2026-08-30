import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AccountProvider } from "@/components/AccountProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas — Your business, run with AI",
  description:
    "Atlas answers customers, books appointments, follows up on leads, manages work, and tells you what needs your attention.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable}`}>
        <AccountProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
