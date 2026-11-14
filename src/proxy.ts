import type { ProxyConfig } from "next/server";

/**
 * This site has no Server Actions. Bots still probe for them with forged
 * `Next-Action` headers, which Next.js answers with a logged error and stack
 * trace per request. Such requests are turned away here before they reach
 * the action handler.
 */
export function proxy() {
  return new Response(null, { status: 404 });
}

// Runs only for requests that carry the header, so regular page views skip the proxy entirely.
export const config: ProxyConfig = {
  matcher: [{ source: "/:path*", has: [{ type: "header", key: "next-action" }] }],
};
