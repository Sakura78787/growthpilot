CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  nickname TEXT NOT NULL,
  grade TEXT NOT NULL,
  primary_goal_type TEXT NOT NULL,
  preferred_focus_time TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE goals (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  deadline TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE milestones (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_date TEXT NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  milestone_id TEXT,
  title TEXT NOT NULL,
  planned_date TEXT NOT NULL,
  planned_duration INTEGER NOT NULL,
  status TEXT NOT NULL,
  delay_reason TEXT,
  actual_start_time TEXT,
  actual_end_time TEXT,
  completion_note TEXT,
  FOREIGN KEY (goal_id) REFERENCES goals(id),
  FOREIGN KEY (milestone_id) REFERENCES milestones(id)
);

CREATE TABLE task_logs (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  result TEXT NOT NULL,
  delay_reason TEXT,
  mood TEXT,
  energy_level INTEGER,
  logged_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  week_start TEXT NOT NULL,
  completion_rate INTEGER NOT NULL,
  top_delay_reason TEXT,
  best_focus_period TEXT,
  ai_summary TEXT NOT NULL,
  next_week_advice TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_payload TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_task_logs_task_id ON task_logs(task_id);
CREATE INDEX idx_task_logs_user_id ON task_logs(user_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_events_user_id ON events(user_id);
