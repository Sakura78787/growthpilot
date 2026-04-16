import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/marketing/hero";

describe("Hero", () => {
  it("renders positioning copy and primary CTA", () => {
    render(<Hero />);
    expect(screen.getByText("你的成长驾驶舱")).toBeInTheDocument();
    expect(screen.getByText(/温和可解释的数据反馈/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始今日行动" })).toBeInTheDocument();
  });
});
