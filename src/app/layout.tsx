import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
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
  title: "Vera — Local Business AI Employee",
  description:
    "One subscription for an AI receptionist that books appointments, follows up with customers, sends quotes, requests reviews, answers FAQs, and handles missed calls — so your team can focus on the work.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vera — Local Business AI Employee",
    description:
      "Automate the repetitive front-desk work. Keep the people who make your business great.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fraunces.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
