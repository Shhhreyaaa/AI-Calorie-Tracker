"use client";

import React, { useState } from "react";
import { Flame, CheckCircle, Award, Sparkles, ChevronRight } from "lucide-react";

export default function StreaksPage() {
  const [streakDays, setStreakDays] = useState(5);

  const achievements = [
    { name: "First Bite", desc: "Log your first meal photo successfully.", unlocked: true },
    { name: "3-Day Sprint", desc: "Log food photos 3 days in a row.", unlocked: true },
    { name: "Weekly Warrior", desc: "Maintain a tracking streak of 7 days.", unlocked: false, progress: 5, target: 7 },
    { name: "Consistency Champ", desc: "Log all meals for 15 consecutive days.", unlocked: false, progress: 5, target: 15 },
  ];

  const calendarDays = [
    { day: "Mon", logged: true },
    { day: "Tue", logged: true },
    { day: "Wed", logged: true },
    { day: "Thu", logged: true },
    { day: "Fri", logged: true },
    { day: "Sat", logged: false },
    { day: "Sun", logged: false },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Consistency</span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">Active Streaks</h2>
      </div>

      {/* Main Flame Core Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark flex flex-col items-center justify-center text-center">
        <div className="bg-brand-coral/10 p-5 rounded-[24px] mb-4 hover:scale-105 transition-transform duration-300">
          <Flame className="w-16 h-16 text-brand-coral fill-brand-coral animate-pulse" />
        </div>
        <h3 className="font-outfit text-4xl font-extrabold tracking-tight text-brand-coral">
          {streakDays} Days
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
          Excellent progress! Keep scanning meals to prolong your streak.
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
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  {ach.name}
                  {ach.unlocked && <Sparkles className="w-3 h-3 text-brand-green fill-brand-green/20" />}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ach.desc}</p>
                
                {/* Progress bar for locked ones */}
                {!ach.unlocked && ach.progress && ach.target && (
                  <div className="flex items-center gap-2 mt-2 w-32">
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-sky h-full rounded-full" style={{ width: `${(ach.progress/ach.target)*100}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-450">{ach.progress}/{ach.target}d</span>
                  </div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
