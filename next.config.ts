import type { NextConfig } from "next";

// @stackforge-eu/factur-x targets Node: embedding hashes with `crypto`, and its
// XSD validator reads schemas via `fs`. In the browser bundle these builtins are
// swapped for the shims in src/shims; XSD validation lives in src/lib/xsd.ts.
const browserShim = (name: string) => ({ browser: `./src/shims/${name}.ts` });

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    resolveAlias: {
      crypto: browserShim("crypto"),
      console: browserShim("console"),
      fs: browserShim("unavailable"),
      path: browserShim("unavailable"),
      url: browserShim("unavailable"),
      // libxml2-wasm probes `module` for its Node code path only.
      module: browserShim("unavailable"),
    },
  },
};

export default nextConfig;
