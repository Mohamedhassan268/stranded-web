import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./world-theme.css";
import { SiteHeader, SiteFooter } from "@/components/SiteShell";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      "https://stranded-qognition-268.vercel.app",
  ),
  title: {
    default: "Stranded — One human. A quantum mind.",
    template: "%s — Stranded",
  },
  description:
    "Explore recorded survival decisions through a quantum-cognition model and its classical control. A Qiskit Fall Fest research prototype.",
  openGraph: {
    type: "website",
    siteName: "Stranded",
    images: [
      {
        url: "/social-card.png",
        width: 1200,
        height: 630,
        alt: "Stranded: one human, a random world, a quantum mind",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#0b1718" };
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
