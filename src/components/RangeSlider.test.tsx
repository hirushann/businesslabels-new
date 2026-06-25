// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import RangeSlider from "./RangeSlider";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "filters.from") return "From";
    if (key === "filters.to") return "To";
    return key;
  },
}));

describe("RangeSlider Component", () => {
  afterEach(() => {
    cleanup();
  });

  it("allows manual typing of partial values without immediate clamping", () => {
    const onChangeMock = vi.fn();
    const onAfterChangeMock = vi.fn();

    render(
      <RangeSlider
        min={0}
        max={800}
        value={[25, 800]}
        onChange={onChangeMock}
        onAfterChange={onAfterChangeMock}
      />
    );

    const fromInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: "7" } });

    expect(fromInput.value).toBe("7");
    expect(onChangeMock).not.toHaveBeenCalled();
    expect(onAfterChangeMock).not.toHaveBeenCalled();
  });

  it("allows clearing input and clamps/validates on blur", () => {
    const onChangeMock = vi.fn();
    const onAfterChangeMock = vi.fn();

    render(
      <RangeSlider
        min={0}
        max={800}
        value={[25, 800]}
        onChange={onChangeMock}
        onAfterChange={onAfterChangeMock}
      />
    );

    const fromInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: "" } });
    expect(fromInput.value).toBe("");

    fireEvent.blur(fromInput);
    expect(fromInput.value).toBe("0");

    expect(onChangeMock).toHaveBeenCalledWith([0, 800]);
    expect(onAfterChangeMock).toHaveBeenCalledWith([0, 800]);
  });

  it("validates and clamps values on Enter key press", () => {
    const onChangeMock = vi.fn();
    const onAfterChangeMock = vi.fn();

    render(
      <RangeSlider
        min={0}
        max={800}
        value={[25, 800]}
        onChange={onChangeMock}
        onAfterChange={onAfterChangeMock}
      />
    );

    const fromInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: "75" } });
    expect(fromInput.value).toBe("75");

    fireEvent.keyDown(fromInput, { key: "Enter", code: "Enter" });

    expect(fromInput.value).toBe("75");
    expect(onChangeMock).toHaveBeenCalledWith([75, 800]);
    expect(onAfterChangeMock).toHaveBeenCalledWith([75, 800]);
  });

  it("clamps values exceeding absolute bounds and respects min <= max", () => {
    const onChangeMock = vi.fn();
    const onAfterChangeMock = vi.fn();

    render(
      <RangeSlider
        min={0}
        max={800}
        value={[25, 800]}
        onChange={onChangeMock}
        onAfterChange={onAfterChangeMock}
      />
    );

    const fromInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;

    fireEvent.change(fromInput, { target: { value: "900" } });
    fireEvent.blur(fromInput);

    expect(fromInput.value).toBe("800");
    expect(onChangeMock).toHaveBeenCalledWith([800, 800]);
    expect(onAfterChangeMock).toHaveBeenCalledWith([800, 800]);
  });

  it("synchronizes local inputs and triggers callbacks during smooth slider dragging", () => {
    const onChangeMock = vi.fn();
    const onAfterChangeMock = vi.fn();

    const { container } = render(
      <RangeSlider
        min={0}
        max={800}
        value={[25, 800]}
        onChange={onChangeMock}
        onAfterChange={onAfterChangeMock}
      />
    );

    const thumbs = container.querySelectorAll("button[type='button']");
    const minThumb = thumbs[0];

    const track = container.querySelector(".bg-slate-200");
    if (track) {
      track.getBoundingClientRect = () => ({
        left: 100,
        right: 500,
        top: 0,
        bottom: 0,
        width: 400,
        height: 4,
        x: 100,
        y: 0,
        toJSON: () => {},
      });
    }

    fireEvent.mouseDown(minThumb);
    fireEvent(window, new MouseEvent("mousemove", { clientX: 200 }));

    const fromInput = screen.getAllByRole("spinbutton")[0] as HTMLInputElement;
    expect(fromInput.value).toBe("200");

    fireEvent(window, new MouseEvent("mouseup"));
    expect(onAfterChangeMock).toHaveBeenCalledWith([200, 800]);
  });

  it("supports visual capping and absoluteMax boundaries", () => {
    const onChangeMock = vi.fn();
    const onAfterChangeMock = vi.fn();

    const { container } = render(
      <RangeSlider
        min={0}
        max={800}
        absoluteMax={140000}
        value={[25, 140000]}
        onChange={onChangeMock}
        onAfterChange={onAfterChangeMock}
      />
    );

    // Verify visual label shows "800+"
    const maxLabel = screen.getByText("800+");
    expect(maxLabel).toBeDefined();

    // Verify label for "To" field displays "(140000)"
    const toLabel = screen.getByText("To (140000)");
    expect(toLabel).toBeDefined();

    // Verify input box initializes to visual cap "800" instead of actual max "140000"
    const toInput = screen.getAllByRole("spinbutton")[1] as HTMLInputElement;
    expect(toInput.value).toBe("800");

    // Verify manual input allows entering values up to absoluteMax (e.g. 5000)
    fireEvent.change(toInput, { target: { value: "5000" } });
    fireEvent.blur(toInput);

    expect(toInput.value).toBe("5000");
    expect(onChangeMock).toHaveBeenCalledWith([25, 5000]);
    expect(onAfterChangeMock).toHaveBeenCalledWith([25, 5000]);

    // Verify dragging the thumb clamps it to max (800)
    const thumbs = container.querySelectorAll("button[type='button']");
    const maxThumb = thumbs[1] as HTMLButtonElement;

    const track = container.querySelector(".bg-slate-200");
    if (track) {
      track.getBoundingClientRect = () => ({
        left: 100,
        right: 500,
        top: 0,
        bottom: 0,
        width: 400,
        height: 4,
        x: 100,
        y: 0,
        toJSON: () => {},
      });
    }

    fireEvent.mouseDown(maxThumb);
    // Drag to 50% position (clientX = 300)
    fireEvent(window, new MouseEvent("mousemove", { clientX: 300 }));
    expect(toInput.value).toBe("400"); // 50% of visual max (800) is 400
    fireEvent(window, new MouseEvent("mouseup"));
  });
});
