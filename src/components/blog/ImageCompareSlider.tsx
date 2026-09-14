'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface ImageCompareSliderProps {
  topImage?: string;
  bottomImage?: string;
  topLabel?: string;
  bottomLabel?: string;
  topSublabel?: string;
  bottomSublabel?: string;
  initialPosition?: number;
  showHint?: boolean;
  className?: string;
}

export default function ImageCompareSlider({
  topImage = '/Schaap-BK-print.jpg',
  bottomImage = '/Schaap-MK-print.jpg',
  topLabel = 'BK',
  bottomLabel = 'MK',
  topSublabel,
  bottomSublabel,
  initialPosition = 50,
  showHint = false,
  className = '',
}: ImageCompareSliderProps) {
  const [position, setPosition] = useState<number>(initialPosition);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const clampedY = Math.max(0, Math.min(y, rect.height));
    const percentage = (clampedY / rect.height) * 100;
    setPosition(Math.round(percentage * 10) / 10);
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(true);
      updatePosition(e.clientY);
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Fallback for browsers that don't support pointer capture on target
      }
    },
    [updatePosition]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      updatePosition(e.clientY);
    },
    [isDragging, updatePosition]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    },
    []
  );

  // Global window listeners as safety for smooth dragging
  useEffect(() => {
    if (!isDragging) return;

    const onGlobalMove = (e: PointerEvent) => {
      updatePosition(e.clientY);
    };

    const onGlobalUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onGlobalMove);
    window.addEventListener('pointerup', onGlobalUp);
    window.addEventListener('pointercancel', onGlobalUp);

    return () => {
      window.removeEventListener('pointermove', onGlobalMove);
      window.removeEventListener('pointerup', onGlobalUp);
      window.removeEventListener('pointercancel', onGlobalUp);
    };
  }, [isDragging, updatePosition]);

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div className={`w-full flex flex-col items-center gap-3 ${className}`}>
      {/* Slider Container */}
      <div
        ref={containerRef}
        role="slider"
        aria-label="Vergelijk Epson BK en MK print"
        aria-valuenow={Math.round(position)}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full aspect-[1080/871] rounded-2xl overflow-hidden shadow-xl border border-slate-200 select-none cursor-ns-resize touch-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand bg-white"
      >
        {/* Bottom Image (MK) - Always in background */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src={bottomImage}
            alt="Epson ColorWorks MK print voorbeeld"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Top Image (BK) - Clipped from bottom */}
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            clipPath: `inset(0 0 ${100 - position}% 0)`,
            WebkitClipPath: `inset(0 0 ${100 - position}% 0)`,
          }}
        >
          <Image
            src={topImage}
            alt="Epson ColorWorks BK print voorbeeld"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Horizontal Divider Line */}
        <div
          className="absolute inset-x-0 h-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.6)] z-20 pointer-events-none"
          style={{ top: `${position}%` }}
        />

        {/* Center Circular Drag Handle */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.4)] border-2 border-white flex items-center justify-center z-30 transition-transform duration-100 ${
            isDragging ? 'scale-110 shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'group-hover:scale-105'
          }`}
          style={{ top: `${position}%` }}
        >
          <svg
            width="14"
            height="18"
            viewBox="0 0 14 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-neutral-800"
          >
            {/* Up arrow */}
            <path d="M7 1L12 6H2L7 1Z" fill="currentColor" />
            {/* Down arrow */}
            <path d="M7 17L2 12H12L7 17Z" fill="currentColor" />
          </svg>
        </div>

        {/* Floating "BK" Badge (Top side) */}
        <div
          className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg transition-opacity duration-200"
          style={{ opacity: position > 15 ? 1 : 0.2 }}
        >
          <span className="font-bold text-sm tracking-wide">{topLabel}</span>
          {topSublabel && (
            <span className="text-xs text-white/70 hidden sm:inline">({topSublabel})</span>
          )}
        </div>

        {/* Floating "MK" Badge (Bottom side) */}
        <div
          className="absolute bottom-4 left-4 z-20 pointer-events-none flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white shadow-lg transition-opacity duration-200"
          style={{ opacity: position < 85 ? 1 : 0.2 }}
        >
          <span className="font-bold text-sm tracking-wide">{bottomLabel}</span>
          {bottomSublabel && (
            <span className="text-xs text-white/70 hidden sm:inline">({bottomSublabel})</span>
          )}
        </div>
      </div>

      {/* Helper text under slider (optional) */}
      {showHint && (
        <p className="text-neutral-500 text-xs sm:text-sm text-center font-normal flex items-center gap-1.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand shrink-0"
          >
            <path d="M12 3v18" />
            <path d="m8 7 4-4 4 4" />
            <path d="m8 17 4 4 4-4" />
          </svg>
          <span>Sleep de balk omhoog of omlaag om het verschil tussen BK en MK inkt te bekijken</span>
        </p>
      )}
    </div>
  );
}
