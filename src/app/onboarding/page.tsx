import { GoalForm } from "@/components/goals/goal-form";
import { SiteShell } from "@/components/layout/site-shell";

export default function OnboardingPage() {
  return (
    <SiteShell
      title="开始你的成长计划"
      description="告诉 GrowthPilot 你想先推进什么，我们会先给你一版柔和、可执行、中文优先的行动拆解。"
    >
      <GoalForm />
    </SiteShell>
  );
}
