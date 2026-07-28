"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import EmergencyNumbers from "@/components/EmergencyNumbers";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CATEGORY_CONFIG, normalizeCategory, type Report } from "@/types/report";

import MiniMap from "./MiniMap";
import VotePanel from "./VotePanel";

interface MetaItem {
  label: string;
  value: string | null;
  sub?: string;
  badge?: React.ReactNode;
}

export default function ReportDetailView({ report }: { report: Report }) {
  const { t } = useLanguage();
  const catCfg = CATEGORY_CONFIG[normalizeCategory(report.category)];
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });
  const fullDate = format(new Date(report.created_at), "PPpp");
  const mapHref = `/map?lat=${report.latitude}&lng=${report.longitude}`;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-900 transition-colors">{t("detail.home")}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={mapHref} className="hover:text-gray-900 transition-colors">{t("detail.map")}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600 truncate max-w-[200px]">{report.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* ── Left column ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Photo */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-200">
              {report.photo_url ? (
                <Image
                  src={report.photo_url}
                  alt={report.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl opacity-30">
                  {catCfg.emoji}
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${catCfg.color}`}>
                  {catCfg.emoji} {catCfg.label}
                </span>
                <StatusBadge status={report.status} />
              </div>
              <h1 className="font-poppins font-black text-3xl text-gray-900 leading-tight">
                {report.title}
              </h1>
            </div>

            {/* Description */}
            {report.description && (
              <div className="p-5 rounded-2xl bg-white border border-gray-200">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  {t("detail.description")}
                </h2>
                <p className="text-gray-700 text-sm leading-relaxed" dir="auto">{report.description}</p>
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Meta card */}
            <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{t("detail.details")}</h2>

              {([
                { label: t("detail.reported"), value: timeAgo, sub: fullDate },
                { label: t("detail.category"), value: `${catCfg.emoji} ${catCfg.label}` },
                { label: t("detail.status"), value: null, badge: <StatusBadge status={report.status} /> },
                report.reporter_name && { label: t("detail.reportedBy"), value: report.reporter_name },
                report.address && { label: t("detail.address"), value: report.address },
                { label: t("detail.coordinates"), value: `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}` },
              ].filter(Boolean) as MetaItem[]).map((meta, i) => (
                <div key={i} className="flex items-start justify-between gap-4">
                  <span className="text-xs text-gray-400 shrink-0 pt-0.5">{meta.label}</span>
                  {meta.badge ?? (
                    <div className="text-right">
                      <span className="text-xs text-gray-700 font-medium">{meta.value}</span>
                      {meta.sub && <p className="text-[10px] text-gray-400 mt-0.5">{meta.sub}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Emergency & service numbers */}
            <EmergencyNumbers />

            {/* Voting */}
            <VotePanel report={report} />

            {/* Mini map */}
            <Link
              href={mapHref}
              className="group relative block rounded-2xl overflow-hidden border border-gray-200 bg-white"
              style={{ height: 220 }}
            >
              <div className="absolute inset-0 z-[500] pointer-events-none">
                <MiniMap lat={report.latitude} lng={report.longitude} category={report.category} />
              </div>
              <div className="absolute inset-0 z-[600] flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 via-transparent to-transparent">
                <span className="px-3 py-1.5 rounded-full bg-white text-gray-900 text-xs font-semibold shadow-lg">
                  {t("detail.openInFullMap")}
                </span>
              </div>
            </Link>

            {/* Actions */}
            <Link
              href={mapHref}
              className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 text-sm font-semibold rounded-xl transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("detail.backToMap")}
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
