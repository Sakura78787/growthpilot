import { buildWeeklyReviewFallback, type WeeklyReviewFallbackInput } from "@/lib/ai/rules";

const defaultReviewInput: WeeklyReviewFallbackInput = {
  completionRate: 68,
  topDelayReason: "任务太大",
  bestFocusPeriod: "20:00 - 22:00",
  dominantMoodLabel: "稳稳推进",
  averageEnergyLevel: 3,
  recentNotes: [],
};

export async function generateWeeklyReview(
  input: Partial<WeeklyReviewFallbackInput> = {},
) {
  return buildWeeklyReviewFallback({
    completionRate: input.completionRate ?? defaultReviewInput.completionRate,
    topDelayReason: input.topDelayReason ?? defaultReviewInput.topDelayReason,
    bestFocusPeriod: input.bestFocusPeriod ?? defaultReviewInput.bestFocusPeriod,
    dominantMoodLabel: input.dominantMoodLabel ?? defaultReviewInput.dominantMoodLabel,
    averageEnergyLevel: input.averageEnergyLevel ?? defaultReviewInput.averageEnergyLevel,
    recentNotes: input.recentNotes ?? defaultReviewInput.recentNotes,
  });
}
