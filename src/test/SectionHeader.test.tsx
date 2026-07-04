import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SectionHeader from "@/components/landing/SectionHeader";

describe("SectionHeader", () => {
  it("renders title and subtitle", () => {
    render(<SectionHeader title="How it works" subtitle="Three steps" />);
    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByText("Three steps")).toBeInTheDocument();
  });
});
