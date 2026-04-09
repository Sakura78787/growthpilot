import Link from "next/link";

import type { GoalTimelineMilestoneView, GoalTimelineTaskView } from "@/lib/db/queries/goals";

type GoalTimelineProps = {
  progressLabel: string;
  nextActionTitle: string;
  nextActionMeta: string;
  milestones: GoalTimelineMilestoneView[];
  looseTasks?: GoalTimelineTaskView[];
};

function TaskList({ items }: { items: GoalTimelineTaskView[] }) {
  if (items.length === 0) {
    return <p className="panel-copy">这一阶段的动作还在整理中，先从前一个阶段稳定推进即可。</p>;
  }

  return (
    <ul className="goal-task-list">
      {items.map((task) => (
        <li key={task.id} className="goal-task-item">
          <div className="goal-task-copy">
            <div className="goal-task-head">
              <strong>{task.title}</strong>
              <span className="goal-task-status">{task.statusLabel}</span>
            </div>
            <p>{task.meta}</p>
            {task.note ? <p>{task.note}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function GoalTimeline({
  progressLabel,
  nextActionTitle,
  nextActionMeta,
  milestones,
  looseTasks = [],
}: GoalTimelineProps) {
  return (
    <section className="shell-panel shell-panel-soft">
      <div className="detail-banner goal-timeline-banner">
        <div>
          <p className="section-chip">阶段拆解</p>
          <h2 className="panel-title">先顺着正在推进的那条线，稳稳把目标往前挪</h2>
          <p className="goal-progress-text">{progressLabel}</p>
          <p className="panel-copy">不用一次性做完全部动作，先让下一小步变得更容易开始。</p>
        </div>

        <div className="goal-next-card">
          <span className="mini-label">今天最适合推进</span>
          <strong>{nextActionTitle}</strong>
          <p>{nextActionMeta}</p>
          <Link href="/focus" className="primary-button">
            去今日行动页
          </Link>
        </div>
      </div>

      <div className="goal-timeline-grid">
        {milestones.map((milestone) => (
          <article key={milestone.id} className="goal-stage-card">
            <div className="goal-stage-head">
              <span className="section-chip">{milestone.statusLabel}</span>
              <p className="goal-stage-date">{milestone.targetDateLabel}</p>
            </div>
            <h3 className="task-title">{milestone.title}</h3>
            <TaskList items={milestone.tasks} />
          </article>
        ))}

        {looseTasks.length > 0 ? (
          <article className="goal-stage-card">
            <div className="goal-stage-head">
              <span className="section-chip">待归档动作</span>
              <p className="goal-stage-date">稍后整理</p>
            </div>
            <h3 className="task-title">这些动作还没挂到某个阶段里</h3>
            <TaskList items={looseTasks} />
          </article>
        ) : null}
      </div>
    </section>
  );
}
