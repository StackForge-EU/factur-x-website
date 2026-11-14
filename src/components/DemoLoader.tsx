"use client";

import dynamic from "next/dynamic";

// The demo is browser-only (pdf-lib, WebAssembly, file APIs) and heavy, so it
// is neither server-rendered nor part of the initial bundle.
const Demo = dynamic(() => import("@/demo/Demo").then((module) => module.Demo), {
  ssr: false,
  loading: () => (
    <p className="rounded-2xl border border-ink-100 bg-white p-8 text-sm text-ink-500">Loading the demo…</p>
  ),
});

export function DemoLoader() {
  return <Demo />;
}
