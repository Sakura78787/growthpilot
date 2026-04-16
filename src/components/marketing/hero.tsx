import Link from "next/link";

export function Hero() {
  return (
    <section className="hero-shell">
      <div className="hero-badge hero-entrance hero-entrance-delay-0">GrowthPilot</div>
      <p className="hero-kicker hero-entrance hero-entrance-delay-0">你的成长驾驶舱</p>
      <h1 className="hero-title hero-entrance hero-entrance-delay-1">
        稳稳地前进，<wbr />
        而不是<span className="hero-title-accent">用力过猛</span>
      </h1>
      <p className="hero-copy hero-entrance hero-entrance-delay-2">
        温和可解释的数据反馈，帮你推进自律、学习和求职目标。
      </p>
      <div className="hero-actions hero-entrance hero-entrance-delay-3">
        <Link className="hero-primary" href="/onboarding">
          开始今日行动
        </Link>
      </div>
    </section>
  );
}
