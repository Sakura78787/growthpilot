"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { readLastGoalId, readOfflineGoalPlan } from "@/lib/client/offline-goal-plan";

type FocusOfflineViewProps = {
  /** 来自 /focus?goalId=，优先于 lastGoalId 解析本地计划 */
  initialGoalId?: string;
};

export function FocusOfflineView({ initialGoalId }: FocusOfflineViewProps) {
  const [taskInfo, setTaskInfo] = useState<{
    goalId: string;
    id: string;
    title: string;
    duration: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preferredId = initialGoalId?.trim() || null;

    const tryResolve = (goalKey: string | null) => {
      if (!goalKey) {
        return null;
      }
      const stored = readOfflineGoalPlan(goalKey);
      const firstTask = stored?.planSeed?.tasks[0];
      if (!firstTask) {
        return null;
      }
      return {
        goalId: goalKey,
        id: `${goalKey}-task-1`,
        title: firstTask.title,
        duration: firstTask.suggestedDuration,
      };
    };

    let resolved = tryResolve(preferredId);
    if (!resolved) {
      const lastGoalId = readLastGoalId();
      resolved = tryResolve(lastGoalId);
    }

    setTaskInfo(resolved);
    setReady(true);
  }, [initialGoalId]);

  if (!ready) {
    return (
      <section className="shell-panel shell-panel-strong focus-offline-skeleton" aria-busy="true">
        <p className="section-chip">今日行动</p>
        <p className="panel-title">加载中…</p>
        <p className="panel-copy">正在读取本地计划与任务。</p>
      </section>
    );
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
