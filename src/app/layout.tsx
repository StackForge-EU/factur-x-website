import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const DESCRIPTION =
  "Open-source TypeScript library to create, embed, extract and validate Factur-X, ZUGFeRD and XRechnung e-invoices (EN 16931, PDF/A-3). Try it in your browser: nothing is uploaded.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "factur-x – Factur-X, ZUGFeRD & XRechnung for TypeScript | Online demo & validator",
    template: "%s – factur-x",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Linked sites (GitHub, npm) are not told where a visitor came from.
  referrer: "no-referrer",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "factur-x",
    title: "factur-x – Factur-X, ZUGFeRD & XRechnung for TypeScript",
    description:
      "Create, embed, extract and validate EN 16931 e-invoices in Node.js and Deno. Free online demo and validator that runs entirely in your browser.",
  },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: "#0b0f14" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Self-hosted, cookieless Umami; `data-domains` keeps local and preview hosts uncounted. */}
        {process.env.NODE_ENV === "production" && (
          <script
            defer
            src="https://umami.stack-forge.cloud/umami"
            data-website-id="18fd01fa-d056-4b1f-871f-b943f282884a"
            data-domains="factur-x.deployo.eu"
          />
        )}
      </head>
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
