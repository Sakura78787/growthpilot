"use client";

import { useState, useTransition } from "react";

import type { GoalPlanSeed } from "@/lib/mock/seed-data";
import { saveOfflineGoalPlan } from "@/lib/client/offline-goal-plan";

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

export function GoalForm() {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
      const response = await fetch("/api/goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as GoalApiResponse;

      if (!response.ok || !data.goal) {
        setFeedback(data.errors?.[0] ?? "生成计划时出现了点小问题，请稍后再试。");
        return;
      }

      if (data.planSeed) {
        saveOfflineGoalPlan(data.goal.id, {
          planSeed: data.planSeed,
          planReason: data.planReason ?? "已生成计划。",
          planSource: data.planSource ?? "rules",
        });
      }

      const nextUrl = new URL("/dashboard", window.location.origin);
      nextUrl.searchParams.set("goalId", data.goal.id);
      nextUrl.searchParams.set("goalTitle", data.goal.title);
      nextUrl.searchParams.set("goalCategory", data.goal.category);
      nextUrl.searchParams.set("planSource", data.planSource ?? "rules");
      nextUrl.searchParams.set("planReason", data.planReason ?? "已按规则模板生成");
      window.location.assign(nextUrl.toString());
    } catch {
      setFeedback("当前网络有点慢，再试一次就好。");
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
        <span>这 14 天最想推进的目标</span>
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
        <p className="form-tip-copy">先给你一版中文目标拆解，再按你的基础与可投入时长做轻量个性化调整。</p>
      </div>

      {feedback ? (
        <p className="form-feedback" role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      <button type="submit" className="primary-button" disabled={isPending}>
        {isPending ? "正在生成..." : "生成我的成长计划"}
      </button>
    </form>
  );
}
