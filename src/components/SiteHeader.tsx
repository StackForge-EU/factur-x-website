import { NPM_URL } from "@/lib/site";
import { StarButton } from "./StarButton";

const NAV = [
  { href: "/#demo", label: "Demo" },
  { href: "/#features", label: "Features" },
  { href: "/#quickstart", label: "Quick start" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/95 text-white backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-3">
          <span className="font-mono text-lg font-semibold tracking-tight">factur-x</span>
          <span className="hidden items-center gap-2 text-xs text-ink-300 sm:flex">
            by
            {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG needs no image optimisation */}
            <img src="/logo-white-orange.svg" alt="StackForge" width={107} height={18} className="h-[18px] w-auto" />
          </span>
        </a>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
          {NAV.map(({ href, label }) => (
            <a key={href} href={href} className="hidden rounded-md px-3 py-2 text-ink-300 hover:text-white md:block">
              {label}
            </a>
          ))}
          <a href={NPM_URL} className="btn btn-ghost-dark hidden px-3 py-2 sm:inline-flex">
            npm
          </a>
          <StarButton label="Star" className="btn-primary px-3 py-2" />
        </nav>
      </div>
    </header>
  );
}
