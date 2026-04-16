"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { readLastGoalId, readOfflineGoalPlan } from "@/lib/client/offline-goal-plan";

export function FocusOfflineView() {
  const [taskInfo, setTaskInfo] = useState<{
    goalId: string;
    id: string;
    title: string;
    duration: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lastGoalId = readLastGoalId();
    if (lastGoalId) {
      const stored = readOfflineGoalPlan(lastGoalId);
      if (stored?.planSeed) {
        const firstTask = stored.planSeed.tasks[0];
        if (firstTask) {
          setTaskInfo({
            goalId: lastGoalId,
            id: `${lastGoalId}-task-1`,
            title: firstTask.title,
            duration: firstTask.suggestedDuration,
          });
        }
      }
    }
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  if (taskInfo) {
    return (
      <FocusSessionCard
        taskId={taskInfo.id}
        taskTitle={taskInfo.title}
        plannedDuration={taskInfo.duration}
        goalDetailHref={`/goals/${taskInfo.goalId}`}
      />
    );
  }

  return (
    <section className="shell-panel shell-panel-soft">
      <p className="section-chip">今日行动</p>
      <h2 className="panel-title">请先创建目标并生成计划</h2>
      <p className="panel-copy">本地尚未找到可用的今日任务。请先完成目标创建与计划生成，再回到这里开始专注。</p>
      <Link href="/onboarding" className="primary-button">
        去创建目标
      </Link>
    </section>
  );
}
