import { GoalForm } from "@/components/goals/goal-form";
import { SiteShell } from "@/components/layout/site-shell";

export default function OnboardingPage() {
  return (
    <SiteShell
      title="开始你的成长计划"
      description="描述你的目标，GrowthPilot 将生成一份可执行的行动计划。"
    >
      <GoalForm />
    </SiteShell>
  );
}
