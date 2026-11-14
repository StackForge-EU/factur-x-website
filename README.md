# factur-x website

Homepage and in-browser demo for [`@stackforge-eu/factur-x`](https://github.com/StackForge-EU/factur-x), served at [factur-x.deployo.eu](https://factur-x.deployo.eu).

- **Create** – form or JSON + PDF (your own or a generated sample) → Factur-X / ZUGFeRD PDF or XRechnung XML
- **Inspect & validate** – extract the XML from a PDF, show it as a readable invoice, validate it against the official XSD and the EN 16931 calculation rules

The demo runs entirely in the visitor's browser; no invoice data reaches the server.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # vitest
pnpm typecheck
pnpm build      # standalone server in .next/standalone
```

Next.js (App Router), React, Tailwind CSS. `pnpm dev` and `pnpm build` first copy the XSD schemas from the npm package into `public/schema` (git-ignored).

To run the standalone build, copy the static files next to it:

```bash
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
node .next/standalone/server.js
```

## Docker

```bash
docker build -t factur-x-website .
docker run --rm -p 5000:5000 factur-x-website   # http://localhost:5000
```

## How it works

- **Library in the browser** – the package targets Node. `next.config.ts` aliases `crypto`, `console`, `fs`, `path`, `url` and `module` to the shims in `src/shims/` for the browser bundle, and `src/lib/xsd.ts` reimplements `validateXsd` on `libxml2-wasm`, which is pinned to the package's version range so both share one copy.
- **GitHub stars** – fetched on the server and cached for hours (`src/lib/github.ts`), so visitors' browsers never contact GitHub.
- **Statistics** – self-hosted, cookieless Umami, included in production builds only and limited to the production domain (`src/app/layout.tsx`).

## Licence

[EUPL-1.2](LICENSE) © StackForge UG (haftungsbeschränkt)

Bundled third-party assets: Space Grotesk (SIL Open Font License 1.1) and `sRGB-v2-micro.icc` from [Compact-ICC-Profiles](https://github.com/saucecontrol/Compact-ICC-Profiles) (CC0).
