import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FocusSessionCard } from "@/components/focus/focus-session-card";
import { ReviewSummary } from "@/components/review/review-summary";

describe("ReviewSummary", () => {
  it("renders the weekly summary, advice, and follow-up links in Chinese", () => {
    render(
      <ReviewSummary
        summary="你本周已经完成了 68% 的关键动作。"
        advice="下周请优先把任务继续压缩到 20 分钟内开始。"
      />,
    );

    expect(screen.getByText("本周复盘")).toBeInTheDocument();
    expect(screen.getByText("下周建议")).toBeInTheDocument();
    expect(screen.getByText("你本周已经完成了 68% 的关键动作。")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "回到成长驾驶舱" })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: "打开成长档案" })).toHaveAttribute("href", "/profile");
  });
});

describe("FocusSessionCard", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("records task start and completion through the task API", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, task: { id: "task-demo-1", status: "doing" } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, task: { id: "task-demo-1", status: "done" } }),
      });

    render(
      <FocusSessionCard
        taskId="task-demo-1"
        taskTitle="完成 20 分钟简历优化"
        plannedDuration={20}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "开始专注" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/tasks/task-demo-1",
      expect.objectContaining({
        method: "PATCH",
      }),
    );
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({
      status: "doing",
    });

    expect(screen.getByLabelText("今天的状态")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("今天的状态"), {
      target: { value: "motivated" },
    });
    fireEvent.change(screen.getByLabelText("当前精力"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("完成备注"), {
      target: { value: "把简历第一屏重新写顺了" },
    });
    fireEvent.click(screen.getByRole("button", { name: "记录完成" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toMatchObject({
      status: "done",
      mood: "motivated",
      energyLevel: 4,
      completionNote: "把简历第一屏重新写顺了",
    });
    expect(screen.getByText(/很好，先完成这一小步/)).toBeInTheDocument();
  });
});
