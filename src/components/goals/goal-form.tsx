"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import type { GoalPlanSeed } from "@/lib/mock/seed-data";
import { saveLastGoalId, saveOfflineGoalPlan } from "@/lib/client/offline-goal-plan";

type GoalApiResponse = {
  ok: boolean;
  planSource?: "llm" | "rules";
  planReason?: string;
  planSeed?: GoalPlanSeed;
  goal?: {
    id: string;
    title: string;
    category: "discipline" | "study" | "job";
  };
  errors?: string[];
};

const STAGES = [
  { label: "连接中", progress: 12 },
  { label: "分析你的目标", progress: 35 },
  { label: "生成个性化计划", progress: 60 },
  { label: "整理计划内容", progress: 82 },
  { label: "即将完成", progress: 95 },
] as const;

export function GoalForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [stageIndex, setStageIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (!isPending) {
      setStageIndex(0);
      setAnimatedProgress(0);
      return;
    }

    let step = 0;
    const advance = () => {
      step++;
      const idx = Math.min(step, STAGES.length - 1);
      setStageIndex(idx);
      setAnimatedProgress(STAGES[idx].progress);
      if (idx < STAGES.length - 1) {
        setTimeout(advance, 1200 + Math.random() * 800);
      }
    };

    setAnimatedProgress(STAGES[0].progress);
    setTimeout(advance, 800 + Math.random() * 400);
  }, [isPending]);

  async function submitGoal(formData: FormData) {
    const payload = {
      title: String(formData.get("title") ?? ""),
      category: String(formData.get("category") ?? "job"),
      deadline: String(formData.get("deadline") ?? ""),
      currentLevel: String(formData.get("currentLevel") ?? "starter"),
      dailyMinutes: Number(formData.get("dailyMinutes") ?? 60),
      mainBlocker: String(formData.get("mainBlocker") ?? ""),
    };

    try {
      setStageIndex(STAGES.length - 1);
      setAnimatedProgress(98);

      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as GoalApiResponse;

      if (!response.ok || !data.goal) {
        setFeedback(data.errors?.[0] ?? "计划生成失败，请稍后重试。");
        return;
      }

      setAnimatedProgress(100);

      if (data.planSeed) {
        saveOfflineGoalPlan(data.goal.id, {
          planSeed: data.planSeed,
          planReason: data.planReason ?? "已生成计划。",
          planSource: data.planSource ?? "rules",
        });
        saveLastGoalId(data.goal.id);
      }

      const nextUrl = new URL("/dashboard", window.location.origin);
      nextUrl.searchParams.set("goalId", data.goal.id);
      nextUrl.searchParams.set("goalTitle", data.goal.title);
      nextUrl.searchParams.set("goalCategory", data.goal.category);
      (router.push as (href: string) => void)(nextUrl.toString());
    } catch {
      setFeedback("网络请求失败，请重试。");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void submitGoal(formData);
    });
  }

  return (
    <form className="form-shell" onSubmit={handleSubmit}>
      <label className="field-block">
        <span>你的目标</span>
        <input
          name="title"
          placeholder="比如：做出两个能投产品经理暑期实习的项目"
          className="field-input"
          required
        />
      </label>

      <div className="field-grid">
        <label className="field-block">
          <span>目标类型</span>
          <select name="category" className="field-input" defaultValue="job">
            <option value="discipline">自律</option>
            <option value="study">学习</option>
            <option value="job">求职</option>
          </select>
        </label>

        <label className="field-block">
          <span>截止日期</span>
          <input name="deadline" type="date" className="field-input" required />
        </label>
      </div>

      <div className="field-grid">
        <label className="field-block">
          <span>当前基础</span>
          <select name="currentLevel" className="field-input" defaultValue="starter">
            <option value="zero">零基础</option>
            <option value="starter">刚起步</option>
            <option value="experienced">已有积累</option>
          </select>
        </label>

        <label className="field-block">
          <span>每天可投入时长（分钟）</span>
          <input name="dailyMinutes" type="number" min={20} max={360} defaultValue={90} className="field-input" required />
        </label>
      </div>

      <label className="field-block">
        <span>当前最大阻碍</span>
        <input
          name="mainBlocker"
          placeholder="比如：任务太大，不知道每天先做哪一步"
          className="field-input"
          required
        />
      </label>

      <div className="form-tip-card">
        <p className="form-tip-title">GrowthPilot 会怎么帮你？</p>
        <p className="form-tip-copy">根据你的基础和可投入时长，生成可执行的行动拆解。</p>
      </div>

      {feedback ? (
        <p className="form-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      {isPending && (
        <div className="plan-progress-container" role="status" aria-live="polite">
          <div className="plan-progress-track">
            <div
              className="plan-progress-fill"
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
          <p className="plan-progress-label">{STAGES[stageIndex].label}</p>
        </div>
      )}

      <button type="submit" className="primary-button" disabled={isPending}>
        {isPending ? STAGES[stageIndex].label : "开始规划"}
      </button>
    </form>
  );
}