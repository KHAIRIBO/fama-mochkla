"use client";

import { Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { EMERGENCY_GROUPS, EMERGENCY_NUMBERS } from "@/lib/emergencyNumbers";

export default function EmergencyNumbers() {
  const { t } = useLanguage();

  return (
    <div className="p-5 rounded-2xl bg-white border border-gray-200 space-y-4">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
        {t("emergency.title")}
      </h2>

      {EMERGENCY_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
            {t(group.labelKey)}
          </p>
          <div className="space-y-1.5">
            {EMERGENCY_NUMBERS.filter((entry) => entry.group === group.key).map((entry) => (
              <a
                key={entry.dial}
                href={`tel:${entry.dial}`}
                className="group flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all"
              >
                <span className="flex items-center gap-2 text-xs text-gray-700 min-w-0">
                  <span className="shrink-0">{entry.emoji}</span>
                  <span className="truncate">{t(entry.labelKey)}</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  <Phone className="w-3 h-3" />
                  {entry.number}
                </span>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
