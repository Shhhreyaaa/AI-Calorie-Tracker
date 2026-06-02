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

  // Determine glass hover class based on label/color
  const hoverClass = 
    label.toLowerCase() === "carbs" ? "glass-panel-sky-hover" :
    label.toLowerCase() === "fat" ? "glass-panel-coral-hover" :
    "glass-panel-hover";

  // Gradient ID and color configurations
  const gradientId = `grad-${label.toLowerCase()}`;
  const gradientColors = 
    label.toLowerCase() === "carbs" ? { start: "#38BDF8", end: "#0284C7" } :
    label.toLowerCase() === "fat" ? { start: "#FB7185", end: "#E11D48" } :
    { start: "#34D399", end: "#059669" };

  // Set glow color string
  const glowShadow = 
    label.toLowerCase() === "carbs" ? "rgba(14, 165, 233, 0.35)" :
    label.toLowerCase() === "fat" ? "rgba(244, 63, 94, 0.35)" :
    "rgba(16, 185, 129, 0.35)";

  return (
    <div className={`glass-panel ${hoverClass} rounded-[24px] p-5 flex flex-col items-center text-center`}>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
        {label}
      </span>
      
      {/* SVG Ring Container */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors.start} />
              <stop offset="100%" stopColor={gradientColors.end} />
            </linearGradient>
          </defs>
          
          {/* Background Gray Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Foreground Progress Ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ 
              transition: "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)",
              filter: `drop-shadow(0 0 6px ${glowShadow})`
            }}
          />
        </svg>
        
        {/* Centered Percentage Indicator */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="font-outfit text-sm font-extrabold text-slate-100">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      {/* Target Metric Breakdown */}
      <div className="mt-4">
        <div className="font-outfit text-base font-extrabold text-slate-100">
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
