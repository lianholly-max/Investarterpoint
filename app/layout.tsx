import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Investart Point | Investment Assitant",
  description:
    "An investment research portfolio with interactive company dashboards and clearly labeled sample financial data.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
