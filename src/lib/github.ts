import { cacheLife } from "next/cache";
import { GITHUB_REPO } from "./site";

/**
 * Star count of the library repository, fetched on the server and cached for
 * hours — visitors' browsers never talk to GitHub. Returns `null` when GitHub
 * is unreachable or rate-limits us, so callers can render without a number.
 */
export async function getStars(): Promise<number | null> {
  "use cache";
  cacheLife("hours");
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return null;
    const repo: unknown = await response.json();
    return typeof repo === "object" &&
      repo !== null &&
      "stargazers_count" in repo &&
      typeof repo.stargazers_count === "number"
      ? repo.stargazers_count
      : null;
  } catch {
    return null;
  }
}
