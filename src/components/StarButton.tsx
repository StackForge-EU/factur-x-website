import { getStars } from "@/lib/github";
import { GITHUB_URL } from "@/lib/site";

const STAR_PATH = "m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9L12 2.5Z";

/** Link to the GitHub repository showing the current star count (server-rendered). */
export async function StarButton({ label, className }: { label: string; className: string }) {
  const stars = await getStars();
  return (
    <a href={GITHUB_URL} className={`btn ${className}`}>
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 fill-current" aria-hidden="true">
        <path d={STAR_PATH} />
      </svg>
      {label}
      {stars !== null && (
        <span className="rounded-md bg-black/20 px-1.5 py-0.5 text-xs tabular-nums">
          {stars.toLocaleString("en-US")}
          <span className="sr-only"> stars</span>
        </span>
      )}
    </a>
  );
}
