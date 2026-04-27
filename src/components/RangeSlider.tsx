"use client";

import { useEffect, useRef, useState, useCallback } from "react";

type RangeSliderProps = {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  onAfterChange?: (value: [number, number]) => void;
  formatValue?: (value: number) => string;
};

export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  onAfterChange,
  formatValue = (v) => String(v),
}: RangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef<"min" | "max" | null>(null);
  const latestValue = useRef<[number, number]>(value);

  useEffect(() => {
    setLocalValue(value);
    latestValue.current = value;
  }, [value]);

  const calculateValue = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return null;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1);
      const rawValue = min + percentage * (max - min);
      return Math.round(rawValue / step) * step;
    },
    [min, max, step]
  );

  const handleMouseDown = (type: "min" | "max") => (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = type;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newValue = calculateValue(e.clientX);
      if (newValue === null) return;

      setLocalValue((prev) => {
        let next: [number, number];
        if (isDragging.current === "min") {
          next = [Math.min(newValue, prev[1]), prev[1]];
        } else {
          next = [prev[0], Math.max(newValue, prev[0])];
        }
        latestValue.current = next;
        onChange(next);
        return next;
      });
    },
    [calculateValue, onChange]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging.current && onAfterChange) {
      onAfterChange(latestValue.current);
    }
    isDragging.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseMove, onAfterChange]);

  const minPos = ((localValue[0] - min) / (max - min)) * 100;
  const maxPos = ((localValue[1] - min) / (max - min)) * 100;

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
          onMouseDown={handleMouseDown("min")}
          className="absolute w-5 h-5 bg-white border-2 border-slate-900 rounded-full -ml-2.5 z-10 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          style={{ left: `${minPos}%` }}
        />
        <button
          type="button"
          onMouseDown={handleMouseDown("max")}
          className="absolute w-5 h-5 bg-white border-2 border-slate-900 rounded-full -ml-2.5 z-10 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
          style={{ left: `${maxPos}%` }}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-slate-400 -mt-4">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>

      {/* Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">From</label>
          <div className="h-10 px-3 border border-slate-200 rounded-lg flex items-center bg-white">
            <span className="text-slate-400 mr-1">€</span>
            <input
              type="number"
              value={localValue[0]}
              onChange={(e) => {
                const v = Math.max(min, Math.min(localValue[1], Number(e.target.value)));
                const next: [number, number] = [v, localValue[1]];
                setLocalValue(next);
                onChange(next);
                onAfterChange?.(next);
              }}
              className="w-full bg-transparent outline-none text-sm font-medium text-slate-900"
            />
          </div>
        </div>
        <div className="text-slate-400 mt-5">To</div>
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">To</label>
          <div className="h-10 px-3 border border-slate-200 rounded-lg flex items-center bg-white">
            <span className="text-slate-400 mr-1">€</span>
            <input
              type="number"
              value={localValue[1]}
              onChange={(e) => {
                const v = Math.min(max, Math.max(localValue[0], Number(e.target.value)));
                const next: [number, number] = [localValue[0], v];
                setLocalValue(next);
                onChange(next);
                onAfterChange?.(next);
              }}
              className="w-full bg-transparent outline-none text-sm font-medium text-slate-900"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
