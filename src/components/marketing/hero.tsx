import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-shell">
      <div className="hero-badge">GrowthPilot</div>
      <p className="hero-kicker">面向中国大陆大学生的成长驾驶舱</p>
      <h1>稳稳地前进，而不是用力过猛</h1>
      <p className="hero-copy">
        用中文、温和且可解释的数据反馈，帮你推进自律、学习和求职目标。
      </p>
      <div className="hero-actions">
        <Link className="hero-primary" href="/onboarding">
          开始今日行动
        </Link>
      </div>
    </section>
  );
}
