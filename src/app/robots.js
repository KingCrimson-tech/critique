import { MetadataRoute } from "next";

// Critique's own robots.txt. Public surfaces crawlable; private reports,
// dashboards, and API routes stay out of indexes.
export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/rubric"],
        disallow: ["/api/", "/scan/", "/sites/", "/compare/", "/debug/", "/login"],
      },
    ],
  };
}
