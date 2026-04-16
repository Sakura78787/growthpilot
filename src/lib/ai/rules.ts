export type WeeklyReviewFallbackInput = {
  completionRate: number;
  topDelayReason: string;
  bestFocusPeriod: string;
  dominantMoodLabel?: string;
  averageEnergyLevel?: number;
  recentNotes?: string[];
};

export type WeeklyReviewFallback = {
  summary: string;
  advice: string;
  highlights: string[];
};

function normalizeCompletionRate(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeEnergyLevel(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return Math.max(1, Math.min(5, Math.round(value)));
}

function delayAdvice(reason: string, window: string) {
  const r = reason.trim();
  if (/焦虑|紧张|压力/i.test(r)) {
    return `下周先把与情绪相关的任务拆到可在 15 分钟内启动；优先在 ${window} 处理最让你犹豫的一步。`;
  }
  if (/时间|忙|排满|冲突/i.test(r)) {
    return `下周用时间块保护 ${window}，只安排一个「必须开始」的小成果，避免同时开多个线程。`;
  }
  if (/太大|不知|迷茫|不知道从/i.test(r)) {
    return `下周围绕「${r.slice(0, 18)}${r.length > 18 ? "…" : ""}」继续向下拆一层，每次只交付一个可见小产物。`;
  }
  if (/拖延|懒|动力/i.test(r)) {
    return `下周把启动成本降到最低：先打开文档或列出三条要点，再在 ${window} 完成最短闭环。`;
  }
  return `下周优先处理与「${r || "阻碍"}」相关的任务，单次只推进一个可见小步，并尽量放在 ${window}。`;
}

function completionEncouragement(rate: number) {
  if (rate >= 85) {
    return "本周完成率较高，节奏稳定。";
  }
  if (rate >= 60) {
    return "本周完成率处于中等偏上，仍有可收紧的启动环节。";
  }
  if (rate >= 40) {
    return "本周完成率一般，建议减少并行任务并固定每日最小产出。";
  }
  return "本周完成率偏低，优先恢复「能开始」而不是「做很多」。";
}

function moodSentence(
  dominantMoodLabel: string | undefined,
  averageEnergyLevel: number | undefined,
  completionRate: number,
) {
  const mood = dominantMoodLabel?.trim();
  const energy = averageEnergyLevel;

  if (mood && /焦虑|紧张|压力/i.test(mood)) {
    return `记录里多次出现偏紧张的状态，建议把任务粒度再降一档，并把复盘频率提高。`;
  }
  if (mood && /疲惫|累|困/i.test(mood)) {
    return `状态偏疲惫时，优先保证睡眠与恢复，再安排 ${completionRate < 50 ? "更低强度" : "稳定强度"} 的推进。`;
  }
  if (mood && /干劲|积极|顺利/i.test(mood)) {
    return `整体状态偏积极，可把产出物定义得更清晰，避免兴奋期过度并行。`;
  }
  if (energy != null && energy <= 2) {
    return `平均精力偏低，建议把单次专注时长缩短、增加休息间隔。`;
  }
  if (energy != null && energy >= 4) {
    return `平均精力较好，适合安排需要连贯思考的任务块。`;
  }
  return "这说明你不是缺少目标，而是需要一个更轻、更容易开始的推进节奏。";
}

export function buildWeeklyReviewFallback(input: WeeklyReviewFallbackInput): WeeklyReviewFallback {
  const completionRate = normalizeCompletionRate(input.completionRate);
  const topDelayReason = input.topDelayReason.trim() || "任务太大";
  const bestFocusPeriod = input.bestFocusPeriod.trim() || "20:00 - 22:00";
  const dominantMoodLabel = input.dominantMoodLabel?.trim();
  const averageEnergyLevel = normalizeEnergyLevel(input.averageEnergyLevel);
  const recentNote = input.recentNotes?.map((item) => item.trim()).find((item) => item.length > 0);

  const moodLine = moodSentence(dominantMoodLabel, averageEnergyLevel, completionRate);
  const rateLine = completionEncouragement(completionRate);
  const adviceCore = delayAdvice(topDelayReason, bestFocusPeriod);

  const highlights = [
    `本周完成率 ${completionRate}%`,
    `最稳时段：${bestFocusPeriod}`,
    `优先处理：${topDelayReason}`,
  ];

  if (dominantMoodLabel) {
    highlights.push(`主导状态：${dominantMoodLabel}`);
  }

  if (averageEnergyLevel) {
    highlights.push(`平均精力：${averageEnergyLevel}/5`);
  }

  if (recentNote) {
    highlights.push(`最近收获：${recentNote}`);
  }

  return {
    summary: `${rateLine} 你本周已经完成了 ${completionRate}% 的关键动作，最稳定的高效时段是 ${bestFocusPeriod}。${recentNote ? `你在完成记录里提到：「${recentNote}」。` : ""} ${moodLine}`,
    advice: `${adviceCore} ${completionRate < 55 ? "先把频率稳住，再谈增量。" : "在保持节奏的前提下，可以逐步提高单次产出要求。"}`,
    highlights,
  };
}
