import type { MetadataRoute } from "next";
import docs from "@/data/docs.json";
import { siteUrl } from "@/data/site";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/blog/", ...docs.posts.map((post) => `/blog/${post.slug}/`), "/demo/", "/repo/", "/docs/", ...docs.pages.map((page) => `/docs/${page.slug}/`), "/team/", "/science/", "/cinematic/", "/privacy/"];
  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
