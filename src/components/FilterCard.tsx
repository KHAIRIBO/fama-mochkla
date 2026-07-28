"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CATEGORY_CONFIG } from "@/types/report";

interface FilterCardProps {
  search: string;
  onSearchChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
}

export default function FilterCard({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
}: FilterCardProps) {
  const { t } = useLanguage();

  const categories: { value: string; label: string }[] = [
    { value: "all", label: t("map.allCategories") },
    ...Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => ({
      value: key,
      label: `${cfg.emoji} ${cfg.label}`,
    })),
  ];

  const statuses: { value: string; label: string }[] = [
    { value: "all", label: t("map.allStatuses") },
    { value: "pending", label: `🟡 ${t("status.pending")}` },
    { value: "in_progress", label: `🔵 ${t("status.in_progress")}` },
    { value: "resolved", label: `🟢 ${t("status.resolved")}` },
  ];

  return (
    <div className="glass rounded-2xl p-4 w-[min(18rem,85vw)] shadow-xl shadow-gray-900/10 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <SlidersHorizontal className="w-4 h-4 text-blue-500" />
        <h2 className="text-sm font-poppins font-bold text-gray-900">{t("map.searchFilter")}</h2>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder={t("map.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-500/50 focus:bg-white transition-all"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
          {t("detail.category")}
        </label>
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="select-modern w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
        >
          {categories.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-1.5">
          {t("detail.status")}
        </label>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="select-modern w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
        >
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active filter indicators */}
      {(category !== "all" || status !== "all" || search) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {search && (
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
                &quot;{search}&quot;
              </span>
          )}
          {category !== "all" && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
               {CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG]?.label}
            </span>
          )}
          {status !== "all" && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200">
              {t(`status.${status}` as "status.pending" | "status.in_progress" | "status.resolved")}
            </span>
          )}
          <button
            onClick={() => {
              onSearchChange("");
              onCategoryChange("all");
              onStatusChange("all");
            }}
            className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:text-gray-900 text-[10px] font-semibold border border-gray-200 transition-all"
          >
            {t("map.clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
