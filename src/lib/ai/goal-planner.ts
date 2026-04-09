import { buildGoalPlan, type GoalPlanInput } from "@/lib/mock/seed-data";

export function buildGoalPlannerFallback(input: GoalPlanInput) {
  const plan = buildGoalPlan(input);
  const openingLine =
    input.category === "job"
      ? "先把求职目标拆成能展示给面试官的阶段成果。"
      : input.category === "study"
        ? "先建立稳定节奏，再追求更高强度。"
        : "先降低开始门槛，再追求持续稳定。";

  return {
    ...plan,
    openingLine,
    firstAction: plan.tasks[0]?.title ?? "先完成一个 20 分钟动作",
  };
}
