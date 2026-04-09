export const goalCategories = ["discipline", "study", "job"] as const;

export type GoalCategory = (typeof goalCategories)[number];

export type GoalPlanInput = {
  title: string;
  category: GoalCategory;
};

export type GoalMilestoneSeed = {
  title: string;
  targetDateLabel: string;
};

export type GoalTaskSeed = {
  title: string;
  bucket: string;
  suggestedDuration: number;
};

export type GoalPlanSeed = {
  milestones: GoalMilestoneSeed[];
  tasks: GoalTaskSeed[];
};

function buildDisciplinePlan(): GoalPlanSeed {
  return {
    milestones: [
      { title: "第一周先稳定在 23:30 前收尾", targetDateLabel: "第 7 天" },
      { title: "第二周稳定在 23:15 前放下手机", targetDateLabel: "第 14 天" },
      { title: "第三周稳定在 23:00 前入睡", targetDateLabel: "第 21 天" },
    ],
    tasks: [
      { title: "今晚 23:30 前关闭短视频", bucket: "night-routine", suggestedDuration: 20 },
      { title: "洗漱后不再打开社交应用", bucket: "night-routine", suggestedDuration: 15 },
      { title: "睡前 10 分钟写下第二天最重要的一件事", bucket: "reflection", suggestedDuration: 10 },
    ],
  };
}

function buildStudyPlan(title: string): GoalPlanSeed {
  return {
    milestones: [
      { title: "先完成基础资料梳理", targetDateLabel: "第 5 天" },
      { title: "形成每周稳定推进节奏", targetDateLabel: "第 12 天" },
      { title: `对「${title}」完成一次阶段复盘`, targetDateLabel: "第 21 天" },
    ],
    tasks: [
      { title: `围绕「${title}」完成 20 分钟核心学习`, bucket: "deep-work", suggestedDuration: 20 },
      { title: "把今天学到的关键点整理成 3 条笔记", bucket: "notes", suggestedDuration: 15 },
      { title: "挑 1 个容易拖延的点拆成更小动作", bucket: "decompose", suggestedDuration: 10 },
    ],
  };
}

function buildJobPlan(title: string): GoalPlanSeed {
  return {
    milestones: [
      { title: "先补齐作品集与简历底稿", targetDateLabel: "第 5 天" },
      { title: "形成每周可展示的项目输出", targetDateLabel: "第 12 天" },
      { title: `围绕「${title}」完成一次完整投递材料打磨`, targetDateLabel: "第 21 天" },
    ],
    tasks: [
      { title: "优化 1 段能体现产品思考的项目描述", bucket: "portfolio", suggestedDuration: 25 },
      { title: "补 1 个数据分析视角的小结", bucket: "analysis", suggestedDuration: 20 },
      { title: "把 1 个大任务拆成今天就能开始的 20 分钟动作", bucket: "action", suggestedDuration: 20 },
    ],
  };
}

export function buildGoalPlan(input: GoalPlanInput): GoalPlanSeed {
  if (input.category === "discipline") {
    return buildDisciplinePlan();
  }

  if (input.category === "job") {
    return buildJobPlan(input.title);
  }

  return buildStudyPlan(input.title);
}
