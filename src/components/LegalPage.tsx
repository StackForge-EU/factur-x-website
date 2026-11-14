import type { ReactNode } from "react";

/** Shared frame for the imprint and privacy pages. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="section-eyebrow">Legal</p>
      <h1 className="section-title">{title}</h1>
      {children}
    </main>
  );
}
