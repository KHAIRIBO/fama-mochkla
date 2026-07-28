import { createClient } from "@supabase/supabase-js";
import { normalizeCategory, type Report } from "@/types/report";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Check .env.local file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

function normalizeReport(row: Report): Report {
  return { ...row, category: normalizeCategory(row.category) };
}

export async function fetchReports(filters?: {
  category?: string;
  status?: string;
}): Promise<Report[]> {
  let query = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data as Report[]) ?? []).map(normalizeReport);
}

export async function fetchReportById(id: string): Promise<Report | null> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return normalizeReport(data as Report);
}

export async function insertReport(
  report: Omit<Report, "id" | "created_at" | "status" | "fixed_votes" | "not_fixed_votes" | "resolved_at">
): Promise<Report> {
  const { data, error } = await supabase
    .from("reports")
    .insert({ ...report, status: "pending" })
    .select()
    .single();

  if (error) throw error;
  return normalizeReport(data as Report);
}

export async function castVote(
  reportId: string,
  voteType: "fixed" | "not_fixed"
): Promise<Report | null> {
  const { data, error } = await supabase.rpc("cast_report_vote", {
    p_report_id: reportId,
    p_vote_type: voteType,
  });

  if (error) throw error;
  return data ? normalizeReport(data as Report) : null;
}

/** Opportunistically removes reports the community marked fixed 24h+ ago — no cron, just runs on page load. */
export async function cleanupResolvedReports(): Promise<void> {
  const { error } = await supabase.rpc("cleanup_resolved_reports");
  if (error) console.error("Cleanup RPC failed:", error);
}

export async function uploadPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("report-photos")
    .upload(fileName, file, { contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage
    .from("report-photos")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
