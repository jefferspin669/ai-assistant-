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
  title: "Atlas AI — Intelligent Workforce for Every Business",
  description:
    "Every business deserves an intelligent workforce, regardless of its size. Atlas builds AI employees and systems so any company — not just the biggest — can run with an intelligent workforce.",
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
