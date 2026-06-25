"use client";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";

type RangeSliderProps = {
  min: number;
  max: number;
  absoluteMax?: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onAfterChange?: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
  inputPrefix?: string;
};

export default function RangeSlider({
  min,
  max,
  absoluteMax,
  step = 1,
  value,
  onChange,
  onAfterChange,
  formatValue = (v) => String(v),
  inputPrefix,
}: RangeSliderProps) {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<"min" | "max" | null>(null);
  const latestValue = useRef<[number, number]>(value);
  const [prevValue, setPrevValue] = useState<[number, number]>(value);
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [minInput, setMinInput] = useState<string>(String(value[0]));
  const [maxInput, setMaxInput] = useState<string>(
    String(value[1] >= (absoluteMax ?? max) ? max : value[1])
  );

  if (value[0] !== prevValue[0] || value[1] !== prevValue[1]) {
    setPrevValue(value);
    setLocalValue(value);
    if (value[0] !== latestValue.current[0]) {
      setMinInput(String(value[0]));
    }
    if (value[1] !== latestValue.current[1]) {
      setMaxInput(String(value[1] >= (absoluteMax ?? max) ? max : value[1]));
    }
    latestValue.current = value;
  }

  function calculateValue(clientX: number) {
    if (!trackRef.current) return null;
    const rect = trackRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
    const rawValue = min + percentage * (max - min);
    return Math.round(rawValue / step) * step;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging.current) return;
    const newValue = calculateValue(e.clientX);
    if (newValue === null) return;

    setLocalValue((prev) => {
      let next: [number, number];
      if (isDragging.current === "min") {
        next = [Math.min(newValue, prev[1]), prev[1]];
        setMinInput(String(next[0]));
      } else {
        next = [prev[0], Math.max(newValue, prev[0])];
        setMaxInput(String(next[1] >= (absoluteMax ?? max) ? max : next[1]));
      }
      latestValue.current = next;
      onChange(next);
      return next;
    });
  }

  function stopDragging() {
    if (isDragging.current && onAfterChange) {
      onAfterChange(latestValue.current);
    }
    isDragging.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", stopDragging);
    window.removeEventListener("pointercancel", stopDragging);
  }

  function handlePointerDown(type: "min" | "max", e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    isDragging.current = type;
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
  }

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMinInput(e.target.value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaxInput(e.target.value);
  };

  const validateAndApply = () => {
    let minVal = minInput.trim() === "" ? min : Number(minInput);
    let maxVal = maxInput.trim() === "" ? max : Number(maxInput);

    if (isNaN(minVal)) minVal = min;
    if (isNaN(maxVal)) maxVal = max;

    const absMax = absoluteMax ?? max;

    // Clamp values to absolute bounds [min, absoluteMax]
    minVal = Math.max(min, Math.min(absMax, minVal));
    maxVal = Math.max(min, Math.min(absMax, maxVal));

    if (minVal > maxVal) {
      minVal = maxVal;
    }

    const next: [number, number] = [minVal, maxVal];
    setLocalValue(next);
    setMinInput(String(minVal));
    setMaxInput(String(maxVal));
    latestValue.current = next;

    if (next[0] !== value[0] || next[1] !== value[1]) {
      onChange(next);
      onAfterChange?.(next);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      validateAndApply();
    }
  };

  const handleBlur = () => {
    validateAndApply();
  };

  const getPercentage = (v: number) => {
    const clamped = Math.min(Math.max(v, min), max);
    return (clamped - min) / (max - min);
  };

  const minPos = getPercentage(localValue[0]) * 100;
  const maxPos = getPercentage(localValue[1]) * 100;

  return (
    <div className="flex flex-col gap-4 select-none">
      <div className="relative h-6 flex items-center mb-2 mx-2">
        {/* Track */}
        <div
          ref={trackRef}
          className="absolute w-full h-1 bg-slate-200 rounded-full"
        >
          {/* Active Track */}
          <div
            className="absolute h-full bg-slate-900 rounded-full"
            style={{
              left: `${minPos}%`,
              right: `${100 - maxPos}%`,
            }}
          />
        </div>

        {/* Thumbs */}
        <button
          type="button"
          onPointerDown={(e) => handlePointerDown("min", e)}
          className="absolute w-5 h-5 bg-white border-2 border-slate-900 rounded-full -ml-2.5 z-10 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          style={{ left: `${minPos}%`, touchAction: "none" }}
        />
        <button
          type="button"
          onPointerDown={(e) => handlePointerDown("max", e)}
          className="absolute w-5 h-5 bg-white border-2 border-slate-900 rounded-full -ml-2.5 z-10 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          style={{ left: `${maxPos}%`, touchAction: "none" }}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-slate-400 -mt-4">
        <span>{formatValue(min)}</span>
        <span>{absoluteMax && absoluteMax > max ? `${formatValue(max)}+` : formatValue(max)}</span>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">{t("filters.from")}</label>
          <div className="h-10 px-3 border border-slate-200 rounded-lg flex items-center bg-white">
            {inputPrefix ? <span className="text-slate-400 mr-1">{inputPrefix}</span> : null}
            <input
              type="number"
              value={minInput}
              onChange={handleMinChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-sm font-medium text-slate-900"
            />
          </div>
        </div>
        <div className="text-slate-400 mt-5">{t("filters.to")}</div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">
            {t("filters.to")} {absoluteMax && absoluteMax > max ? `(${formatValue(absoluteMax)})` : ""}
          </label>
          <div className="h-10 px-3 border border-slate-200 rounded-lg flex items-center bg-white">
            {inputPrefix ? <span className="text-slate-400 mr-1">{inputPrefix}</span> : null}
            <input
              type="number"
              value={maxInput}
              onChange={handleMaxChange}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none text-sm font-medium text-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
