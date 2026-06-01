"use client";

import React from "react";
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

export default function BottomNavigation() {
  const pathname = usePathname();

  // Hide navigation on auth pages
  const hideNavRoutes = ["/login", "/signup"];
  if (hideNavRoutes.includes(pathname)) {
    return null;
  }

  const navItems = [
    { name: "Home", path: "/dashboard", icon: Home },
    { name: "Scan", path: "/camera", icon: Camera },
    { name: "AI", path: "/analysis", icon: Sparkles },
    { name: "Diary", path: "/diary", icon: BookOpen },
    { name: "Stats", path: "/analytics", icon: BarChart2 },
    { name: "Streaks", path: "/streaks", icon: Flame },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-905/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800/80 px-4 py-2 sm:py-3 shadow-lg">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.path === "/dashboard" && pathname === "/");
          
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className="flex flex-col items-center gap-1 flex-1 py-1.5 transition-all group"
            >
              <div 
                className={`p-1.5 rounded-xl transition-all duration-305 flex items-center justify-center ${
                  isActive 
                    ? "bg-brand-green/10 text-brand-green scale-110" 
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "stroke-[2.5px]" : "stroke-[2px] group-hover:scale-105"}`} />
              </div>
              <span 
                className={`text-[9px] font-bold tracking-wider uppercase transition-colors duration-300 ${
                  isActive 
                    ? "text-brand-green font-extrabold" 
                    : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-400"
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
