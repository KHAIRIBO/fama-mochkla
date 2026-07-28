import type { NestedKeyPaths } from "@/lib/i18n/LanguageContext";

export interface EmergencyNumberEntry {
  /** Display format, shown to the user */
  number: string;
  /** Digits-only, used in the tel: link */
  dial: string;
  emoji: string;
  labelKey: NestedKeyPaths;
  group: "emergency" | "help" | "service";
}

/** Tunisia emergency and public service numbers, shown on every report. */
export const EMERGENCY_NUMBERS: EmergencyNumberEntry[] = [
  { number: "190", dial: "190", emoji: "🚑", labelKey: "emergency.medical", group: "emergency" },
  { number: "197", dial: "197", emoji: "👮", labelKey: "emergency.police", group: "emergency" },
  { number: "198", dial: "198", emoji: "🚒", labelKey: "emergency.fire", group: "emergency" },
  { number: "193", dial: "193", emoji: "🛡️", labelKey: "emergency.nationalGuard", group: "emergency" },
  { number: "194", dial: "194", emoji: "🚤", labelKey: "emergency.maritimeGuard", group: "emergency" },

  { number: "1899", dial: "1899", emoji: "🆘", labelKey: "emergency.womenViolence", group: "help" },
  { number: "192", dial: "192", emoji: "🧒", labelKey: "emergency.childProtection", group: "help" },
  { number: "1809", dial: "1809", emoji: "💬", labelKey: "emergency.childPsych", group: "help" },
  { number: "1833", dial: "1833", emoji: "🧓", labelKey: "emergency.elderlySupport", group: "help" },

  { number: "80 100 333", dial: "80100333", emoji: "🧭", labelKey: "emergency.tourist", group: "service" },
  { number: "80 101 111", dial: "80101111", emoji: "🕵️", labelKey: "emergency.suspiciousActivity", group: "service" },
  { number: "80 101 919", dial: "80101919", emoji: "🏥", labelKey: "emergency.healthAssistance", group: "service" },
  { number: "80 100 319", dial: "80100319", emoji: "💧", labelKey: "emergency.water", group: "service" },
  { number: "80 100 444", dial: "80100444", emoji: "⚡", labelKey: "emergency.electricity", group: "service" },
];

export const EMERGENCY_GROUPS = [
  { key: "emergency", labelKey: "emergency.emergencyGroup" },
  { key: "help", labelKey: "emergency.helpGroup" },
  { key: "service", labelKey: "emergency.serviceGroup" },
] as const satisfies { key: EmergencyNumberEntry["group"]; labelKey: NestedKeyPaths }[];
