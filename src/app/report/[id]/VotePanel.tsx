"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import VoteButtons from "@/components/VoteButtons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Report } from "@/types/report";

export default function VotePanel({ report: initialReport }: { report: Report }) {
  const { t } = useLanguage();
  const [report, setReport] = useState(initialReport);

  if (report.status === "resolved" && report.resolved_at) {
    const removalTime = new Date(report.resolved_at).getTime() + 24 * 60 * 60 * 1000;
    const removalLabel = formatDistanceToNow(removalTime, { addSuffix: true });

    return (
      <div className="p-5 rounded-2xl bg-green-50 border border-green-200 space-y-1.5">
        <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
          <CheckCircle2 className="w-4 h-4" />
          {t("vote.markedFixed")}
        </div>
        <p className="text-xs text-green-700/80">
          {t("vote.willBeRemoved", { time: removalLabel })}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-3">
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">
          {t("vote.hasBeenFixed")}
        </h2>
        <p className="text-xs text-gray-400">
          {t("vote.voteHelp")}
        </p>
      </div>
      <VoteButtons report={report} onVoted={setReport} />
    </div>
  );
}
