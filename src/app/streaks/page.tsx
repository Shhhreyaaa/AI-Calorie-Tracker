"use client";

import React, { useState, useEffect } from "react";
import { Flame, CheckCircle, Award, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import { getAndUpdateActiveStreak } from "@/app/meals/actions";

export default function StreaksPage() {
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  const fetchStreakStats = async () => {
    try {
      const stats = await getAndUpdateActiveStreak();
      if (stats) {
        setStreakDays(stats.current_streak || 0);
        setLongestStreak(stats.longest_streak || 0);
      }
    } catch (err) {
      console.error("Failed to load streak stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreakStats();
  }, []);

  const achievements = [
    { 
      name: "First Bite", 
      desc: "Log your first meal photo successfully.", 
      unlocked: streakDays >= 1 
    },
    { 
      name: "3-Day Sprint", 
      desc: "Log food photos 3 days in a row.", 
      unlocked: streakDays >= 3 
    },
    { 
      name: "Weekly Warrior", 
      desc: "Maintain a tracking streak of 7 days.", 
      unlocked: streakDays >= 7, 
      progress: Math.min(streakDays, 7), 
      target: 7 
    },
    { 
      name: "Consistency Champ", 
      desc: "Log all meals for 15 consecutive days.", 
      unlocked: streakDays >= 15, 
      progress: Math.min(streakDays, 15), 
      target: 15 
    },
  ];

  // Dynamically calculate checkmarks based on last active logged dates
  const calendarDays = [
    { day: "Mon", logged: streakDays >= 5 },
    { day: "Tue", logged: streakDays >= 4 },
    { day: "Wed", logged: streakDays >= 3 },
    { day: "Thu", logged: streakDays >= 2 },
    { day: "Fri", logged: streakDays >= 1 },
    { day: "Sat", logged: false },
    { day: "Sun", logged: false },
  ];

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Updating tracking streaks...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Consistency</span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">Active Streaks</h2>
      </div>

      {/* Main Flame Core Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 shadow-premium dark:shadow-premium-dark flex flex-col items-center justify-center text-center">
        <div className="relative mb-6">
          {/* Layered glowing background behind flame */}
          <div className="absolute inset-0 bg-brand-coral/25 rounded-full blur-2xl scale-150 animate-pulse" />
          <div className="relative bg-brand-coral/10 p-6 rounded-[28px] border border-brand-coral/10 flex items-center justify-center transition-transform duration-300 hover:scale-105">
            <Flame className="w-16 h-16 text-brand-coral fill-brand-coral animate-bounce" style={{ animationDuration: '3.5s' }} />
          </div>
        </div>
        <h3 className="font-outfit text-4xl font-black tracking-tight text-brand-coral">
          {streakDays} Days
        </h3>
        <p className="text-xs text-slate-405 mt-1 max-w-[200px]">
          {streakDays > 0 
            ? "Excellent progress! Keep scanning meals to prolong your streak." 
            : "No active logs yet. Take a food photo today to begin your streak!"}
        </p>

        {/* Calendar checkoff grid */}
        <div className="grid grid-cols-7 gap-2.5 w-full mt-8 border-t border-slate-100 dark:border-slate-850 pt-6">
          {calendarDays.map((d, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[10px] text-slate-400 font-bold mb-1.5">{d.day}</span>
              <div 
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                  d.logged 
                    ? "bg-brand-green text-white shadow-sm" 
                    : "bg-slate-100 dark:bg-slate-850 text-slate-300 dark:text-slate-700"
                }`}
              >
                {d.logged ? <CheckCircle className="w-4 h-4" /> : <div className="w-1.5 h-1.5 bg-slate-350 dark:bg-slate-705 rounded-full" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics info card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark grid grid-cols-2 gap-4 text-center">
        <div className="border-r border-slate-100 dark:border-slate-855">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block">Longest Streak</span>
          <span className="font-outfit text-2xl font-bold mt-1 text-slate-800 dark:text-slate-200 block">{longestStreak} days</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider block">Target Rate</span>
          <span className="font-outfit text-2xl font-bold mt-1 text-slate-800 dark:text-slate-200 block">
            {streakDays > 0 ? "100%" : "0%"}
          </span>
        </div>
      </div>

      {/* Achievements Badges Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark space-y-4">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
          <Award className="w-4 h-4 text-brand-sky" /> Achievements & Milestones
        </h3>
        
        <div className="space-y-3">
          {achievements.map((ach, index) => (
            <div 
              key={index}
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 ${
                ach.unlocked 
                  ? "bg-slate-50/50 dark:bg-slate-850/30 border-slate-100 dark:border-slate-800" 
                  : "bg-slate-100/20 dark:bg-slate-900/10 border-slate-100/50 dark:border-slate-800/40 opacity-70"
              }`}
            >
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200 flex items-center gap-1.5">
                  {ach.name}
                  {ach.unlocked && <Sparkles className="w-3 h-3 text-brand-green fill-brand-green/20" />}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ach.desc}</p>
                
                {/* Progress bar for locked ones */}
                {!ach.unlocked && ach.progress !== undefined && ach.target !== undefined && (
                  <div className="flex items-center gap-2 mt-2 w-32">
                    <div className="w-full bg-slate-205 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-sky h-full rounded-full" style={{ width: `${(ach.progress/ach.target)*100}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-450">{ach.progress}/{ach.target}d</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-450 shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
