import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Espeezy Admin",
  description: "Administrative Dashboard for Espeezy",
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
