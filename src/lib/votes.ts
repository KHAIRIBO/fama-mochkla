const STORAGE_KEY = "fama-mochkla:voted-reports";

function readVotedIds(): Record<string, "fixed" | "not_fixed"> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** One vote per browser per report — there's no login system, so this is the ceiling on anti-spam. */
export function getVote(reportId: string): "fixed" | "not_fixed" | null {
  return readVotedIds()[reportId] ?? null;
}

export function recordVote(reportId: string, voteType: "fixed" | "not_fixed") {
  if (typeof window === "undefined") return;
  const votes = readVotedIds();
  votes[reportId] = voteType;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}
