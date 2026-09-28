import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CvakniTO",
  description: "Pokladní aplikace s fakturací",
  appleWebApp: {
    capable: true,
    title: "CvakniTO",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#115E43",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
