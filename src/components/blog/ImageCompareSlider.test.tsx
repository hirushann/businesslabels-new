// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ImageCompareSlider from "./ImageCompareSlider";

describe("ImageCompareSlider Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the comparison slider with BK and MK labels", () => {
    render(
      <ImageCompareSlider
        topImage="/Schaap-BK-print.jpg"
        bottomImage="/Schaap-MK-print.jpg"
        topLabel="BK"
        bottomLabel="MK"
      />
    );

    const slider = screen.getByRole("slider", { name: /vergelijk epson bk en mk print/i });
    expect(slider).toBeDefined();
    expect(slider.getAttribute("aria-valuenow")).toBe("50");

    expect(screen.getByText("BK")).toBeDefined();
    expect(screen.getByText("MK")).toBeDefined();
  });

  it("supports keyboard navigation with ArrowUp and ArrowDown", () => {
    render(
      <ImageCompareSlider
        topImage="/Schaap-BK-print.jpg"
        bottomImage="/Schaap-MK-print.jpg"
        initialPosition={50}
      />
    );

    const slider = screen.getByRole("slider");

    // Press ArrowUp: position should decrease (reveal more bottom image)
    fireEvent.keyDown(slider, { key: "ArrowUp" });
    expect(slider.getAttribute("aria-valuenow")).toBe("45");

    // Press ArrowDown: position should increase (reveal more top image)
    fireEvent.keyDown(slider, { key: "ArrowDown" });
    expect(slider.getAttribute("aria-valuenow")).toBe("50");
  });

  it("renders custom sublabels when provided", () => {
    render(
      <ImageCompareSlider
        topLabel="BK"
        bottomLabel="MK"
        topSublabel="Fotozwart"
        bottomSublabel="Matzwart"
      />
    );

    expect(screen.getByText("(Fotozwart)")).toBeDefined();
    expect(screen.getByText("(Matzwart)")).toBeDefined();
  });
});
