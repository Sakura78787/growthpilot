import type { GoalPlanSeed } from "@/lib/mock/seed-data";

const STORAGE_KEY_PREFIX = "growthpilot:offlineGoalPlan:";
const LAST_GOAL_ID_KEY = "growthpilot:lastGoalId";

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
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${goalId}`, JSON.stringify(payload));
  } catch {
    // Quota or private mode — ignore
  }
}

export function readOfflineGoalPlan(goalId: string): OfflineGoalPlanPayload | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${goalId}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as OfflineGoalPlanPayload;
  } catch {
    return null;
  }
}

export function saveLastGoalId(goalId: string) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(LAST_GOAL_ID_KEY, goalId);
  } catch {
    // Quota or private mode — ignore
  }
}

export function readLastGoalId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(LAST_GOAL_ID_KEY);
  } catch {
    return null;
  }
}
