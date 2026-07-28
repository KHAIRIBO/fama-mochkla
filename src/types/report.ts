// Report type matching the Supabase `reports` table schema

export type ReportCategory =
  | "zbila"
  | "hofra"
  | "dhaw"
  | "ma_famech_ma"
  | "accident"
  | "other";

export type ReportStatus = "pending" | "in_progress" | "resolved";

export interface Report {
  id: string;
  title: string;
  description: string | null;
  category: ReportCategory;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  photo_url: string | null;
  reporter_name: string | null;
  created_at: string;
  fixed_votes: number;
  not_fixed_votes: number;
  resolved_at: string | null;
}

export const CATEGORY_CONFIG: Record<
  ReportCategory,
  { label: string; emoji: string; color: string; pinColor: string }
> = {
  zbila: {
    label: "Zbila",
    emoji: "🗑️",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    pinColor: "#6b7280",
  },
  hofra: {
    label: "7ofra fi Dhnya",
    emoji: "🕳️",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    pinColor: "#f97316",
  },
  dhaw: {
    label: "Dhaw",
    emoji: "💡",
    color: "bg-yellow-100 text-yellow-700 border-yellow-300",
    pinColor: "#eab308",
  },
  ma_famech_ma: {
    label: "Ma Famech Ma",
    emoji: "🚱",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    pinColor: "#3b82f6",
  },
  accident: {
    label: "Accident",
    emoji: "🚧",
    color: "bg-red-100 text-red-700 border-red-300",
    pinColor: "#ef4444",
  },
  other: {
    label: "Other",
    emoji: "❓",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    pinColor: "#a855f7",
  },
};

export const STATUS_CONFIG: Record<
  ReportStatus,
  { label: string; color: string; dot: string }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    dot: "bg-yellow-500",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-blue-100 text-blue-800 border border-blue-300",
    dot: "bg-blue-500",
  },
  resolved: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 border border-green-300",
    dot: "bg-green-500",
  },
};

/** Legacy category keys for backward compatibility with old DB rows */
export const LEGACY_CATEGORY_MAP: Record<string, ReportCategory> = {
  garbage: "zbila",
  pothole: "hofra",
  streetlight: "dhaw",
  water_leak: "ma_famech_ma",
  road_damage: "accident",
};

export function normalizeCategory(category: string): ReportCategory {
  if (category in CATEGORY_CONFIG) return category as ReportCategory;
  return LEGACY_CATEGORY_MAP[category] ?? "other";
}
