import { z } from "zod";

import { goalCategories } from "@/lib/mock/seed-data";

export const goalRequestSchema = z.object({
  title: z.string().trim().min(4, "目标至少写 4 个字").max(48, "目标先控制在 48 个字内"),
  category: z.enum(goalCategories),
  deadline: z.string().min(1, "请选择截止日期"),
});

export type GoalRequest = z.infer<typeof goalRequestSchema>;
