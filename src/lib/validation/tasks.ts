import { z } from "zod";

export const taskStatusOptions = ["todo", "doing", "done", "skipped"] as const;
export const taskMoodOptions = ["steady", "tired", "anxious", "motivated"] as const;

export const taskUpdateSchema = z.object({
  status: z.enum(taskStatusOptions),
  delayReason: z.string().trim().max(40, "拖延原因先控制在 40 个字内").optional(),
  mood: z.enum(taskMoodOptions).optional(),
  energyLevel: z.coerce.number().int().min(1, "精力值至少为 1").max(5, "精力值最高为 5").optional(),
  completionNote: z.string().trim().max(80, "完成备注先控制在 80 个字内").optional(),
});

export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
