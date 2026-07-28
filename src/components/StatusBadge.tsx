"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { STATUS_CONFIG, type ReportStatus } from "@/types/report";

interface StatusBadgeProps {
  status: ReportStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const { t } = useLanguage();
  const cfg = STATUS_CONFIG[status];
  const textSize = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${textSize} ${cfg.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(`status.${status}`)}
    </span>
  );
}
