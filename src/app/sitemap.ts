import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/imprint`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
