import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchReportById } from "@/lib/supabase";
import { CATEGORY_CONFIG, normalizeCategory } from "@/types/report";
import ReportDetailView from "./ReportDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const report = await fetchReportById(id);

  if (!report) {
    return { title: "Report not found — fama-mochkla" };
  }

  const catCfg = CATEGORY_CONFIG[normalizeCategory(report.category)];
  const description =
    report.description?.slice(0, 160) ||
    `${catCfg.label} reported${report.address ? ` near ${report.address}` : ""} — fama-mochkla`;

  return {
    title: `${report.title} — fama-mochkla`,
    description,
    openGraph: {
      title: report.title,
      description,
      type: "article",
      images: report.photo_url ? [report.photo_url] : undefined,
    },
  };
}

export default async function ReportDetailPage({ params }: Props) {
  const { id } = await params;
  const report = await fetchReportById(id);

  if (!report) notFound();

  return <ReportDetailView report={report} />;
}
