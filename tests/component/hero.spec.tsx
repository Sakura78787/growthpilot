import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Hero } from "@/components/marketing/hero";

describe("Hero", () => {
  it("renders the Chinese-first promise", () => {
    render(<Hero />);
    expect(screen.getByText("面向中国大陆大学生的成长驾驶舱")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "开始今日行动" })).toBeInTheDocument();
  });
});
