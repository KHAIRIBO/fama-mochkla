"use client";

import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CATEGORY_CONFIG, normalizeCategory, type Report } from "@/types/report";

interface ReportCardProps {
  report: Report;
  index?: number;
}

export default function ReportCard({ report, index = 0 }: ReportCardProps) {
  const { t } = useLanguage();
  const category = normalizeCategory(report.category);
  const catCfg = CATEGORY_CONFIG[category];
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
    >
      <Link href={`/report/${report.id}`} className="block group">
        <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-md shadow-gray-200/60 card-hover">
          <div className="relative h-48 w-full overflow-hidden bg-gray-100">
            {report.photo_url ? (
              <Image
                src={report.photo_url}
                alt={report.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                {catCfg.emoji}
              </div>
            )}
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-sm ${catCfg.color}`}
              >
                <span>{catCfg.emoji}</span>
                {catCfg.label}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-poppins font-bold text-sm leading-snug line-clamp-2 flex-1 text-gray-900">
                {report.title}
              </h3>
              <StatusBadge status={report.status} size="sm" />
            </div>

            {report.address && (
              <p className="text-xs mb-3 flex items-center gap-1 text-gray-500">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate min-w-0 flex-1" dir="auto">{report.address}</span>
              </p>
            )}

            <div className="flex items-center justify-between text-[11px] pt-2 border-t text-gray-400 border-gray-100">
              <span>{timeAgo}</span>
              {report.reporter_name && (
                <span className="font-medium text-gray-500">
                  {t("reportCard.by", { name: report.reporter_name })}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
