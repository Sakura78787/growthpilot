import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  nickname: text("nickname").notNull(),
  grade: text("grade").notNull(),
  primaryGoalType: text("primary_goal_type").notNull(),
  preferredFocusTime: text("preferred_focus_time").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  deadline: text("deadline").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const milestones = sqliteTable("milestones", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  title: text("title").notNull(),
  targetDate: text("target_date").notNull(),
  status: text("status").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  goalId: text("goal_id").notNull(),
  milestoneId: text("milestone_id"),
  title: text("title").notNull(),
  plannedDate: text("planned_date").notNull(),
  plannedDuration: integer("planned_duration").notNull(),
  status: text("status").notNull(),
  delayReason: text("delay_reason"),
  actualStartTime: text("actual_start_time"),
  actualEndTime: text("actual_end_time"),
  completionNote: text("completion_note"),
});

export const taskLogs = sqliteTable("task_logs", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull(),
  userId: text("user_id").notNull(),
  result: text("result").notNull(),
  delayReason: text("delay_reason"),
  mood: text("mood"),
  energyLevel: integer("energy_level"),
  loggedAt: text("logged_at").notNull(),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  weekStart: text("week_start").notNull(),
  completionRate: integer("completion_rate").notNull(),
  topDelayReason: text("top_delay_reason"),
  bestFocusPeriod: text("best_focus_period"),
  aiSummary: text("ai_summary").notNull(),
  nextWeekAdvice: text("next_week_advice").notNull(),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  eventName: text("event_name").notNull(),
  eventPayload: text("event_payload").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});
