"use client";

import { useState, useEffect } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { castVote } from "@/lib/supabase";
import { getVote, recordVote } from "@/lib/votes";
import type { Report } from "@/types/report";

interface VoteButtonsProps {
  report: Pick<Report, "id" | "status" | "fixed_votes" | "not_fixed_votes">;
  onVoted?: (updated: Report) => void;
  compact?: boolean;
}

export default function VoteButtons({ report, onVoted, compact = false }: VoteButtonsProps) {
  const { t } = useLanguage();
  const [myVote, setMyVote] = useState<"fixed" | "not_fixed" | null>(null);
  const [fixedVotes, setFixedVotes] = useState(report.fixed_votes ?? 0);
  const [notFixedVotes, setNotFixedVotes] = useState(report.not_fixed_votes ?? 0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading localStorage (client-only) on mount
    setMyVote(getVote(report.id));
  }, [report.id]);

  const isResolved = report.status === "resolved";
  const locked = isResolved || myVote != null || submitting;

  const handleVote = async (voteType: "fixed" | "not_fixed") => {
    if (locked) return;
    setSubmitting(true);
    setError(null);

    const prevFixed = fixedVotes;
    const prevNotFixed = notFixedVotes;
    setMyVote(voteType);
    if (voteType === "fixed") setFixedVotes((v) => v + 1);
    else setNotFixedVotes((v) => v + 1);

    try {
      const updated = await castVote(report.id, voteType);
      recordVote(report.id, voteType);
      if (updated) {
        setFixedVotes(updated.fixed_votes);
        setNotFixedVotes(updated.not_fixed_votes);
        onVoted?.(updated);
      }
    } catch (err) {
      setMyVote(null);
      setFixedVotes(prevFixed);
      setNotFixedVotes(prevNotFixed);
      setError(err instanceof Error ? err.message : t("vote.voteFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const btnBase = `inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all disabled:cursor-not-allowed ${
    compact ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
  }`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={locked}
          onClick={() => handleVote("fixed")}
          className={`${btnBase} ${
            myVote === "fixed"
              ? "border-green-300 bg-green-50 text-green-700"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-green-300 hover:bg-green-50 hover:text-green-700 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 disabled:hover:text-gray-600"
          }`}
        >
          <ThumbsUp className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          {t("vote.fixed")} · {fixedVotes}
        </button>
        <button
          type="button"
          disabled={locked}
          onClick={() => handleVote("not_fixed")}
          className={`${btnBase} ${
            myVote === "not_fixed"
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-gray-200 bg-gray-50 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:hover:border-gray-200 disabled:hover:bg-gray-50 disabled:hover:text-gray-600"
          }`}
        >
          <ThumbsDown className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
          {t("vote.notFixed")} · {notFixedVotes}
        </button>
      </div>
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      {!isResolved && myVote && (
        <p className="text-[10px] text-gray-400">
          {t("vote.thanksVoted", { vote: myVote === "fixed" ? t("vote.fixed") : t("vote.notFixed") })}
        </p>
      )}
    </div>
  );
}
