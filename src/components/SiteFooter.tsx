import { GITHUB_URL, JSR_URL, NPM_URL } from "@/lib/site";

const LINKS = [
  { href: GITHUB_URL, label: "GitHub" },
  { href: NPM_URL, label: "npm" },
  { href: JSR_URL, label: "JSR" },
  { href: "/imprint", label: "Imprint" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink-950 py-10 text-sm text-ink-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div>
          <a href="https://www.stack-forge.eu">
            {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG needs no image optimisation */}
            <img src="/logo-white-orange.svg" alt="StackForge" width={143} height={24} className="h-6 w-auto" />
          </a>
          <p className="mt-3">© 2026 StackForge UG (haftungsbeschränkt) · Built and hosted in the EU.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
          {LINKS.map(({ href, label }) => (
            <a key={href} href={href} className="hover:text-white">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
