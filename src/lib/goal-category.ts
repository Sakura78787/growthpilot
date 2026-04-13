import { goalCategories, type GoalCategory } from "@/lib/mock/seed-data";

/** Server- and client-safe: normalize query param / string to a known goal category. */
export function normalizeGoalCategory(value: string | undefined): GoalCategory {
  return goalCategories.includes(value as GoalCategory) ? (value as GoalCategory) : "job";
}
