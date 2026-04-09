import { z } from "zod";

import { goalCategories } from "@/lib/mock/seed-data";

export const goalCurrentLevels = ["zero", "starter", "experienced"] as const;

export const goalRequestSchema = z.object({
  title: z.string().trim().min(4, "目标至少写 4 个字").max(48, "目标先控制在 48 个字内"),
  category: z.enum(goalCategories),
  deadline: z.string().min(1, "请选择截止日期"),
  currentLevel: z.enum(goalCurrentLevels),
  dailyMinutes: z.coerce
    .number()
    .int("每日可投入时长请填整数")
    .min(20, "每日可投入时长至少 20 分钟")
    .max(360, "每日可投入时长最多 360 分钟"),
  mainBlocker: z.string().trim().min(2, "请写下当前主要阻碍").max(80, "主要阻碍先控制在 80 个字内"),
});

export type GoalRequest = z.infer<typeof goalRequestSchema>;
