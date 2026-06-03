"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Camera, 
  Sparkles, 
  BookOpen, 
  BarChart2, 
  Flame, 
  Settings 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/AppContext";

export default function BottomNavigation() {
  const pathname = usePathname();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { user } = useApp();

  // Hide navigation if user is logged out
  if (!user) {
    return null;
  }

  // Hide navigation on auth pages
  const hideNavRoutes = ["/login", "/signup", "/onboarding"];
  if (hideNavRoutes.includes(pathname)) {
    return null;
  }

  const navItems = [
    { name: "Home", path: "/dashboard", icon: Home, color: "#00ff88" },
    { name: "Scan", path: "/camera", icon: Camera, color: "#00e5ff" },
    { name: "Coach", path: "/coach", icon: Sparkles, color: "#8b5cf6" },
    { name: "Diary", path: "/diary", icon: BookOpen, color: "#7c3aed" },
    { name: "Stats", path: "/analytics", icon: BarChart2, color: "#38bdf8" },
    { name: "Streaks", path: "/streaks", icon: Flame, color: "#ff4d9d" },
    { name: "Settings", path: "/settings", icon: Settings, color: "#6366f1" },
  ];

  return (
    <nav 
      className="fixed bottom-[20px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] sm:w-[min(90vw,900px)] h-[78px] rounded-[28px] z-50 bg-[#050816]/85 backdrop-blur-[24px] border border-white/6 flex items-center px-4"
      style={{
        boxShadow: "0 0 40px rgba(0,255,170,0.08), 0 0 60px rgba(0,170,255,0.08), 0 20px 50px rgba(0,0,0,0.5)"
      }}
    >
      {/* Subtle Animated Neon Top Border */}
      <div className="absolute top-0 left-6 right-6 h-[2px] bg-gradient-to-r from-[#00ff88] via-[#00e5ff] via-[#8b5cf6] to-[#ff4d9d] opacity-80 rounded-full animate-neon-flow" />

      <div className="w-full flex justify-between items-center relative h-full">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path === "/dashboard" && pathname === "/");
          
          return (
            <div
              key={item.path}
              className="flex-1 flex justify-center relative h-full items-center"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip Bubble */}
              <AnimatePresence>
                {hoveredIndex === idx && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute bottom-[80px] px-3.5 py-1.5 rounded-xl bg-slate-950/90 border backdrop-blur-md text-[9px] font-extrabold uppercase tracking-widest text-white z-50 pointer-events-none"
                    style={{ 
                      borderColor: `${item.color}40`, 
                      boxShadow: `0 0 15px ${item.color}25, inset 0 0 8px ${item.color}15`,
                    }}
                  >
                    {item.name}
                    {/* Tooltip arrow */}
                    <div 
                      className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 bg-slate-950/95 border-r border-b"
                      style={{ borderColor: `${item.color}40` }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Shifting active tab underline highlight */}
              {isActive && (
                <motion.div 
                  layoutId="neonActiveUnderline"
                  className="absolute bottom-2 w-5 h-1 rounded-full opacity-90"
                  style={{ 
                    backgroundColor: item.color,
                    boxShadow: `0 0 10px ${item.color}, 0 0 20px ${item.color}`
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              <Link 
                href={item.path}
                prefetch={true}
                className="w-full h-full flex flex-col items-center justify-center cursor-pointer select-none"
              >
                <motion.div
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className={`flex flex-col items-center justify-center gap-1 transition-all ${
                    isActive ? "animate-pulse-glow" : ""
                  }`}
                  style={{
                    "--pulse-color": item.color,
                    color: isActive ? item.color : "#64748b",
                    filter: isActive ? `drop-shadow(0 0 8px ${item.color})` : "none"
                  } as React.CSSProperties}
                >
                  <div className="p-1 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 stroke-[2px]" />
                  </div>
                  <span 
                    className="text-[9px] tracking-widest uppercase font-semibold mt-0.5 transition-all"
                    style={{
                      textShadow: isActive ? `0 0 6px ${item.color}` : "none",
                      fontWeight: isActive ? 800 : 600
                    }}
                  >
                    {item.name}
                  </span>
                </motion.div>
              </Link>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
