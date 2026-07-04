import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Users, Heart, MessageCircle } from "lucide-react";
import ScrollStepsPath from "@/components/landing/ScrollStepsPath";

const STEPS = [
  { step: "01", icon: Users, title: "Build profile", desc: "Answer questions" },
  { step: "02", icon: Heart, title: "Swipe & match", desc: "Find people" },
  { step: "03", icon: MessageCircle, title: "Chat & move in", desc: "Message matches" },
];

describe("ScrollStepsPath", () => {
  it("renders every step card", () => {
    render(<ScrollStepsPath steps={STEPS} />);
    for (const s of STEPS) {
      expect(screen.getByText(s.title)).toBeInTheDocument();
      expect(screen.getByText(s.desc)).toBeInTheDocument();
      expect(screen.getByText(s.step)).toBeInTheDocument();
    }
  });

  it("renders horizontal and vertical connector lines", () => {
    const { container } = render(<ScrollStepsPath steps={STEPS} />);
    const svgs = container.querySelectorAll("svg[aria-hidden='true'][data-connector]");
    expect(svgs).toHaveLength(2);
  });

  it("mirrors the horizontal line in RTL", () => {
    const { container } = render(<ScrollStepsPath steps={STEPS} rtl />);
    const horizontal = container.querySelector("svg[data-connector='horizontal']") as SVGElement;
    expect(horizontal.style.transform).toBe("scaleX(-1)");
  });
});
