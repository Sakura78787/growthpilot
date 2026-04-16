import Link from "next/link";
import type { ReactNode } from "react";

type SiteShellProps = {
  title: string;
  description?: string;
  badge?: string;
  /** 页面顶部标签；不传则不展示 */
  heroChip?: string;
  children: ReactNode;
};

const navItems = [
  { href: "/", label: "首页" },
  { href: "/onboarding", label: "开始计划" },
  { href: "/dashboard", label: "成长驾驶舱" },
] as const;

export function SiteShell({
  title,
  description = "把目标拆成今天就能开始的动作，让每一步都更轻、更稳。",
  badge = "GrowthPilot",
  heroChip,
  children,
}: SiteShellProps) {
  return (
    <main className="shell-page">
      <div className="shell-orb shell-orb-left" aria-hidden="true" />
      <div className="shell-orb shell-orb-right" aria-hidden="true" />
      <div className="shell-orb shell-orb-bottom" aria-hidden="true" />

      <div className="shell-frame">
        <header className="shell-topbar">
          <Link href="/" className="shell-brand">
            <span className="shell-brand-dot" aria-hidden="true" />
            {badge}
          </Link>
          <nav className="shell-nav" aria-label="主要导航">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="shell-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="shell-hero-card">
          {heroChip ? <p className="section-chip">{heroChip}</p> : null}
          <h1>{title}</h1>
          <p>{description}</p>
        </section>

        <div className="shell-content">{children}</div>
      </div>
    </main>
  );
}
