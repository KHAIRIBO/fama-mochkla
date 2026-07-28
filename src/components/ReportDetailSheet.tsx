"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MapPin, X } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_CONFIG,
  normalizeCategory,
  type Report,
} from "@/types/report";

interface ReportDetailSheetProps {
  report: Report | null;
  onClose: () => void;
}

/** Mobile-friendly bottom sheet for read-only report details (pin tap). */
export default function ReportDetailSheet({
  report,
  onClose,
}: ReportDetailSheetProps) {
  const category = report ? normalizeCategory(report.category) : null;
  const catCfg = category ? CATEGORY_CONFIG[category] : null;

  return (
    <AnimatePresence>
      {report && catCfg && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-2xl bg-[#111] border-t border-white/10 shadow-2xl flex flex-col"
            role="dialog"
            aria-label="Report details"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${catCfg.color}`}
                >
                  {catCfg.emoji} {catCfg.label}
                </span>
                <StatusBadge status={report.status} size="sm" />
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-4">
              {report.photo_url && (
                <div className="relative w-full h-48 rounded-2xl overflow-hidden bg-[#1a1a1a]">
                  <Image
                    src={report.photo_url}
                    alt={report.title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                </div>
              )}

              <h3 className="font-poppins font-bold text-lg text-white leading-snug">
                {report.title}
              </h3>

              {report.description && (
                <p className="text-sm text-white/60 leading-relaxed" dir="auto">
                  {report.description}
                </p>
              )}

              {report.address && (
                <p className="text-sm text-white/40 flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{report.address}</span>
                </p>
              )}

              <p className="text-xs text-white/30">
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </p>

              <Link href={`/report/${report.id}`} className="block">
                <Button className="w-full h-12 text-base">
                  View Full Details →
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
