"use client";

import React, { useState, useEffect } from "react";

interface MacroRingProps {
  value: number;
  target: number;
  label: string;
  unit?: string;
  strokeColor: string;
  glowColor?: string;
}

export default function MacroRing({
  value,
  target,
  label,
  unit = "g",
  strokeColor,
  glowColor
}: MacroRingProps) {
  const percentage = target > 0 ? (value / target) * 100 : 0;
  const radius = 34;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  
  // State to control transition animation on mount
  const [dashOffset, setDashOffset] = useState(circumference);

  useEffect(() => {
    // Calculate the target offset
    const targetOffset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    // Animate to target offset
    const timer = setTimeout(() => {
      setDashOffset(targetOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage, circumference]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 flex flex-col items-center text-center shadow-premium dark:shadow-premium-dark hover:translate-y-[-2px] transition-all duration-300">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">
        {label}
      </span>
      
      {/* SVG Ring Container */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background Gray Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Foreground Progress Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ 
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: glowColor ? `drop-shadow(0 4px 6px ${glowColor})` : undefined
            }}
          />
        </svg>
        
        {/* Centered Percentage Indicator */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-outfit text-sm font-extrabold text-slate-800 dark:text-slate-200">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      {/* Target Metric Breakdown */}
      <div className="mt-4">
        <div className="font-outfit text-base font-extrabold text-slate-800 dark:text-slate-200">
          {value}
          <span className="text-xs font-semibold text-slate-400 ml-0.5">{unit}</span>
        </div>
        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
          Goal: {target}{unit}
        </div>
      </div>
    </div>
  );
}
