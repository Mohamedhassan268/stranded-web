import type { Metadata, Viewport } from "next";
import "@fontsource/barlow/700.css";
import "@fontsource/cascadia-mono/400.css";
import "@fontsource-variable/inter";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteShell";
import { siteName, siteUrl } from "@/data/site";
export const metadata: Metadata = {
  metadataBase: new URL(
    siteUrl,
  ),
  title: {
    default: `${siteName}: quantum against classical minds in an evacuation`,
    template: `%s — ${siteName}`,
  },
  description:
    "Explore recorded evacuation decisions through a quantum-cognition model and its classical control, share .qsim scenarios and read the documentation. A model, not a prediction.",
  openGraph: {
    type: "website",
    siteName,
    images: [
      {
        url: "/social-card.png",
        width: 1200,
        height: 630,
        alt: "Qognition: quantum against classical minds in an evacuation",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#3e2816" };
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
