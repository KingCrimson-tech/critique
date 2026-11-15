import { notFound } from "next/navigation";
import { getScanForViewer, getViewerFromHeaders } from "@/lib/scans";
import { ReportView } from "@/components/report/report-view";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { scan, allowed } = await getScanForViewer(id, await getViewerFromHeaders());
  if (!scan || !allowed) return { title: "No such scan" };
  return {
    title: `Report — ${new URL(scan.url).host}`,
    description: `Critique report for ${scan.url}: score ${scan.score.overall}/100.`,
  };
}

export default async function ScanPage({ params }) {
  const { id } = await params;
  const { scan, allowed } = await getScanForViewer(id, await getViewerFromHeaders());
  if (!scan || !allowed) notFound();
  return <ReportView scan={scan} />;
}
