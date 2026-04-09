import { buildProfileViewFromRecords } from "@/lib/db/queries/profile";

export function getFallbackProfileOverview() {
  return buildProfileViewFromRecords({
    goals: [
      { title: "做出两个能投产品经理暑期实习的项目", category: "job" },
      { title: "稳定晚间学习节奏", category: "study" },
    ],
    tasks: [
      { title: "优化项目首页叙事", status: "done", plannedDate: "2026-04-07", actualStartTime: "2026-04-07T12:10:00.000Z" },
      { title: "补一张流程图", status: "doing", plannedDate: "2026-04-08", actualStartTime: "2026-04-08T12:30:00.000Z" },
      { title: "写一页数据复盘", status: "done", plannedDate: "2026-04-09", actualStartTime: "2026-04-09T13:10:00.000Z" },
      { title: "整理一轮投递清单", status: "todo", plannedDate: "2026-04-10", actualStartTime: null },
    ],
    taskLogs: [
      { mood: "motivated", energyLevel: 4, loggedAt: "2026-04-07T12:10:00.000Z", delayReason: null },
      { mood: "steady", energyLevel: 3, loggedAt: "2026-04-08T12:30:00.000Z", delayReason: "任务太大" },
      { mood: "motivated", energyLevel: 5, loggedAt: "2026-04-09T13:10:00.000Z", delayReason: null },
    ],
    reviews: [
      {
        completionRate: 72,
        bestFocusPeriod: "20:00 - 22:00",
        nextWeekAdvice: "下周继续把任务压到 20 分钟内开始。",
      },
    ],
  });
}
