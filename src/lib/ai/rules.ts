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

export function buildWeeklyReviewFallback(input: WeeklyReviewFallbackInput): WeeklyReviewFallback {
  const completionRate = normalizeCompletionRate(input.completionRate);
  const topDelayReason = input.topDelayReason.trim() || "任务太大";
  const bestFocusPeriod = input.bestFocusPeriod.trim() || "20:00 - 22:00";
  const dominantMoodLabel = input.dominantMoodLabel?.trim();
  const averageEnergyLevel = normalizeEnergyLevel(input.averageEnergyLevel);
  const recentNote = input.recentNotes?.map((item) => item.trim()).find((item) => item.length > 0);

  const moodSentence =
    dominantMoodLabel || averageEnergyLevel
      ? `这周的执行记录里，你大多处在“${dominantMoodLabel ?? "稳稳推进"}”的状态，平均精力大约是 ${averageEnergyLevel ?? 3}/5。`
      : "这说明你不是缺少目标，而是需要一个更轻、更容易开始的推进节奏。";

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
    summary: `你本周已经完成了 ${completionRate}% 的关键动作，最稳定的高效时段是 ${bestFocusPeriod}。${recentNote ? `你在完成记录里提到：“${recentNote}”。` : ""}${moodSentence}`,
    advice: `下周请优先拆小“${topDelayReason}”相关任务，把每个动作压缩到 20 分钟以内开始；如果感觉状态起伏，就优先在 ${bestFocusPeriod} 安排最难开始的那一步。`,
    highlights,
  };
}
