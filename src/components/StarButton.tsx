import { getStars } from "@/lib/github";
import { GITHUB_URL } from "@/lib/site";

const GITHUB_MARK =
  "M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z";
const STAR = "M8 .25a.75.75 0 0 1 .67.42l1.88 3.82 4.21.61a.75.75 0 0 1 .42 1.28l-3.05 2.97.72 4.19a.75.75 0 0 1-1.09.79L8 12.35l-3.77 1.98a.75.75 0 0 1-1.08-.79l.72-4.19L.82 6.38a.75.75 0 0 1 .42-1.28l4.21-.61L7.33.67A.75.75 0 0 1 8 .25Z";

/**
 * GitHub-style star button: GitHub mark (plus an optional label) on the left,
 * star count in a separate segment. The count is rendered on the server, so no
 * visitor talks to GitHub.
 */
export async function StarButton({ label, compact = false }: { label?: string; compact?: boolean }) {
  const stars = await getStars();
  const padding = compact ? "px-3 py-2" : "px-4 py-2.5";
  return (
    <a
      href={GITHUB_URL}
      aria-label={label ? undefined : "factur-x on GitHub"}
      className="group inline-flex items-stretch overflow-hidden rounded-lg border border-ink-700 text-sm font-semibold text-white transition-colors hover:border-ink-500"
    >
      <span className={`flex items-center gap-2 bg-ink-800 transition-colors group-hover:bg-ink-700 ${padding}`}>
        <svg viewBox="0 0 16 16" className="size-4 shrink-0 fill-current" aria-hidden="true">
          <path d={GITHUB_MARK} />
        </svg>
        {label}
      </span>
      {stars !== null && (
        <span className={`flex items-center gap-1.5 border-l border-ink-700 bg-ink-900 tabular-nums ${compact ? "px-2.5" : "px-3"}`}>
          <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 fill-forge-400" aria-hidden="true">
            <path d={STAR} />
          </svg>
          {stars.toLocaleString("en-US")}
          <span className="sr-only"> stars</span>
        </span>
      )}
    </a>
  );
}
