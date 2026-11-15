import { notFound } from "next/navigation";
import { resolveShareLink } from "@/lib/scans";
import { ReportView } from "@/components/report/report-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const scan = resolveShareLink(slug);
  if (!scan) return { title: "No such report" };
  const host = new URL(scan.url).host;
  return {
    title: `${host} scored ${scan.score.overall}/100`,
    description: `${scan.score.verdict.title} ${scan.score.verdict.line} Full audit: SEO, security, AI-readability, content, UX.`,
    openGraph: {
      title: `${host} scored ${scan.score.overall}/100 — Critique`,
      description: scan.score.verdict.title,
      images: [{ url: `/api/og/${slug}`, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function SharePage({ params }) {
  const { slug } = await params;
  const scan = resolveShareLink(slug);
  if (!scan) notFound();
  return <ReportView scan={scan} shared />;
}
