"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

const MIN_PROGRESS_VISIBLE_MS = 550;
const STAGE_ADVANCE_MS = 850;

export function GoalForm() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const submitLockRef = useRef(false);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isSubmitting) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    let current = 0;
    setStageIndex(0);
    setAnimatedProgress(STAGES[0].progress);

    const maxIdxBeforeDone = STAGES.length - 2;
    progressIntervalRef.current = setInterval(() => {
      current = Math.min(current + 1, maxIdxBeforeDone);
      setStageIndex(current);
      setAnimatedProgress(STAGES[current].progress);
      if (current >= maxIdxBeforeDone && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }, STAGE_ADVANCE_MS);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isSubmitting]);

  function clearProgressTimers() {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }

  async function runSubmit(formData: FormData) {
    const payload = {
      title: String(formData.get("title") ?? ""),
      category: String(formData.get("category") ?? "job"),
      deadline: String(formData.get("deadline") ?? ""),
      currentLevel: String(formData.get("currentLevel") ?? "starter"),
      dailyMinutes: Number(formData.get("dailyMinutes") ?? 60),
      mainBlocker: String(formData.get("mainBlocker") ?? ""),
    };

    const started = Date.now();

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
        clearProgressTimers();
        setFeedback(data.errors?.[0] ?? "计划生成失败，请稍后重试。");
        setIsSubmitting(false);
        setStageIndex(0);
        setAnimatedProgress(0);
        return;
      }

      clearProgressTimers();
      setAnimatedProgress(100);
      setStageIndex(STAGES.length - 1);

      if (data.planSeed) {
        saveOfflineGoalPlan(data.goal.id, {
          planSeed: data.planSeed,
          planReason: data.planReason ?? "已生成计划。",
          planSource: data.planSource ?? "rules",
        });
        saveLastGoalId(data.goal.id);
      }

      const elapsed = Date.now() - started;
      if (elapsed < MIN_PROGRESS_VISIBLE_MS) {
        await new Promise((r) => setTimeout(r, MIN_PROGRESS_VISIBLE_MS - elapsed));
      }

      const nextUrl = new URL("/dashboard", window.location.origin);
      nextUrl.searchParams.set("goalId", data.goal.id);
      nextUrl.searchParams.set("goalTitle", data.goal.title);
      nextUrl.searchParams.set("goalCategory", data.goal.category);
      (router.push as (href: string) => void)(nextUrl.toString());
    } catch {
      clearProgressTimers();
      setFeedback("网络请求失败，请重试。");
      setIsSubmitting(false);
      setStageIndex(0);
      setAnimatedProgress(0);
    } finally {
      submitLockRef.current = false;
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    setFeedback(null);
    setIsSubmitting(true);
    setStageIndex(0);
    setAnimatedProgress(STAGES[0].progress);

    const formData = new FormData(event.currentTarget);
    void runSubmit(formData);
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

      {isSubmitting && (
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

      <button type="submit" className="primary-button" disabled={isSubmitting}>
        {isSubmitting ? STAGES[stageIndex].label : "开始规划"}
      </button>
    </form>
  );
}
