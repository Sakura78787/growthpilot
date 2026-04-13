import type { GoalPlanSeed } from "@/lib/mock/seed-data";

const STORAGE_KEY_PREFIX = "growthpilot:offlineGoalPlan:";

export type OfflineGoalPlanPayload = {
  planSource: "llm" | "rules";
  planReason: string;
  planSeed: GoalPlanSeed;
};

export function saveOfflineGoalPlan(goalId: string, payload: OfflineGoalPlanPayload) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${goalId}`, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore
  }
}

export function readOfflineGoalPlan(goalId: string): OfflineGoalPlanPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${goalId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as OfflineGoalPlanPayload;
  } catch {
    return null;
  }
}
