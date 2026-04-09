"use client";

import { useState, useTransition } from "react";

type GoalApiResponse = {
  ok: boolean;
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
      category: String(formData.get("category") ?? "discipline"),
      deadline: String(formData.get("deadline") ?? ""),
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

      const nextUrl = new URL("/dashboard", window.location.origin);
      nextUrl.searchParams.set("goalId", data.goal.id);
      nextUrl.searchParams.set("goalTitle", data.goal.title);
      nextUrl.searchParams.set("goalCategory", data.goal.category);
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

      <div className="form-tip-card">
        <p className="form-tip-title">GrowthPilot 会怎么帮你？</p>
        <p className="form-tip-copy">先给你一版中文目标拆解，再把今天最容易开始的动作直接摆到驾驶舱里。</p>
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
