"use client";

import Link from "next/link";
import { useState } from "react";

import type { TaskUpdateInput } from "@/lib/validation/tasks";

const starterActions = [
  "先把目标拆成一个 20 分钟动作",
  "把手机放到看不见的地方",
  "结束后立刻记录一句今天的感受",
];

type FocusSessionCardProps = {
  taskId?: string;
  taskTitle?: string;
  plannedDuration?: number;
  /** 完成后「查看目标详情」跳转；不传则该链接指向成长驾驶舱 */
  goalDetailHref?: string;
};

type SessionPhase = "idle" | "active" | "done";

export function FocusSessionCard({
  taskId = "task-demo-1",
  taskTitle = "完成 20 分钟简历优化",
  plannedDuration = 20,
  goalDetailHref,
}: FocusSessionCardProps) {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mood, setMood] = useState<TaskUpdateInput["mood"]>("steady");
  const [energyLevel, setEnergyLevel] = useState("3");
  const [delayReason, setDelayReason] = useState("");
  const [completionNote, setCompletionNote] = useState("");

  async function patchTask(payload: TaskUpdateInput) {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("task-update-failed");
    }

    return response.json();
  }

  async function handleStart() {
    setSubmitting(true);
    setError(null);

    try {
      await patchTask({
        status: "doing",
      });
      setPhase("active");
    } catch {
      setError("这次开始记录失败了，稍后再试一下。");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleComplete() {
    setSubmitting(true);
    setError(null);

    try {
      await patchTask({
        status: "done",
        mood,
        energyLevel: Number(energyLevel),
        delayReason: delayReason.trim() || undefined,
        completionNote: completionNote.trim() || undefined,
      });
      setPhase("done");
    } catch {
      setError("这次完成记录没有成功，先别急，等会再试一次。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell-panel shell-panel-strong focus-card">
      <p className="section-chip">今日关键动作</p>
      <h2 className="panel-title">{taskTitle}</h2>
      <p className="panel-copy">将任务拆解为 {plannedDuration} 分钟的起步动作。</p>

      <div className="focus-meter" aria-hidden="true">
        <span className="focus-meter-ring" />
        <div>
          <strong>专注 {plannedDuration} 分钟</strong>
          <p>单次会话时长</p>
        </div>
      </div>

      <ul className="focus-points">
        {starterActions.map((action) => (
          <li key={action}>{action}</li>
        ))}
      </ul>

      {phase === "idle" ? (
        <button type="button" className="primary-button" onClick={handleStart} disabled={submitting}>
          {submitting ? "正在记录开始..." : "开始专注"}
        </button>
      ) : null}

      {phase === "active" ? (
        <div className="focus-log-form">
          <label className="field-block">
            <span>今天的状态</span>
            <select
              className="field-input"
              value={mood ?? "steady"}
              onChange={(event) => setMood(event.target.value as TaskUpdateInput["mood"])}
            >
              <option value="steady">稳稳推进</option>
              <option value="motivated">很有干劲</option>
              <option value="tired">有点疲惫</option>
              <option value="anxious">有些焦虑</option>
            </select>
          </label>

          <label className="field-block">
            <span>当前精力</span>
            <select
              className="field-input"
              value={energyLevel}
              onChange={(event) => setEnergyLevel(event.target.value)}
            >
              <option value="1">1 分</option>
              <option value="2">2 分</option>
              <option value="3">3 分</option>
              <option value="4">4 分</option>
              <option value="5">5 分</option>
            </select>
          </label>

          <label className="field-block">
            <span>完成备注</span>
            <textarea
              className="field-input field-textarea"
              value={completionNote}
              onChange={(event) => setCompletionNote(event.target.value)}
              placeholder="比如：把简历第一屏重新写顺了"
            />
          </label>

          <label className="field-block">
            <span>如果刚才卡住了，记录一下原因</span>
            <input
              className="field-input"
              value={delayReason}
              onChange={(event) => setDelayReason(event.target.value)}
              placeholder="比如：任务太大"
            />
          </label>

          <button type="button" className="primary-button" onClick={handleComplete} disabled={submitting}>
            {submitting ? "正在保存完成记录..." : "记录完成"}
          </button>
        </div>
      ) : null}

      {phase === "done" ? (
        <>
          <p className="focus-feedback" role="status" aria-live="polite">
            已完成今日关键动作。
          </p>
          <div className="focus-done-actions">
            <Link href="/dashboard" className="primary-button">
              返回驾驶舱
            </Link>
            <Link href={goalDetailHref ?? "/dashboard"} className="secondary-link">
              {goalDetailHref ? "查看目标详情" : "打开成长驾驶舱"}
            </Link>
          </div>
        </>
      ) : null}

      {error ? (
        <p className="focus-feedback" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
