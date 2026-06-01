"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Flame, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  PlusCircle,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function Dashboard() {
  const [streak, setStreak] = useState(5);
  const [calories, setCalories] = useState(1320);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const targetCalories = 2000;
  const protein = 92;
  const targetProtein = 150;
  const carbs = 114;
  const targetCarbs = 200;
  const fat = 48;
  const targetFat = 65;

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
          <Flame className="w-4 h-4 text-brand-coral fill-current" />
          Streak Incremented! Keep going 🔥
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Daily Summary</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>June 1, 2026</span>
        </div>
      </div>

      {/* Main Calorie & Streak Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Calorie Ring Widget */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[180px]">
          <div className="flex justify-between items-start">
            <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider">Remaining</h3>
            <span className="bg-brand-green/10 text-brand-green text-[10px] font-bold px-2 py-0.5 rounded-lg">
              Goal {targetCalories}
            </span>
          </div>

          <div className="my-2">
            <div className="font-outfit text-4xl font-extrabold tracking-tight">
              {targetCalories - calories} <span className="text-xs font-medium text-slate-400">kcal left</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Consumed: {calories} kcal</div>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-brand-green h-full rounded-full transition-all duration-500" 
              style={{ width: `${(calories/targetCalories)*100}%` }}
            />
          </div>
        </div>

        {/* Streak Flame Widget */}
        <div 
          onClick={() => {
            setStreak(prev => prev + 1);
            setShowToast(true);
          }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[180px] cursor-pointer hover:scale-[1.01] transition-transform group"
        >
          <div className="flex justify-between items-start">
            <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider">Streak Status</h3>
            <Flame className="w-5 h-5 text-brand-coral fill-brand-coral group-hover:scale-110 transition-transform" />
          </div>

          <div className="my-2">
            <div className="font-outfit text-4xl font-extrabold tracking-tight text-brand-coral">
              {streak} <span className="text-xs font-medium text-slate-400">days active</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-medium">Tap to log meal and keep streak</div>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold uppercase">
            <span>Log status: Complete today</span>
          </div>
        </div>

      </div>

      {/* Macronutrient widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark space-y-4">
        <h3 className="font-outfit text-sm font-semibold">Macronutrients Progress</h3>
        
        <div className="space-y-3">
          {/* Protein */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Protein</span>
              <span className="text-slate-700 dark:text-slate-350">{protein}g / {targetProtein}g</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-green h-full rounded-full" style={{ width: `${(protein/targetProtein)*100}%` }} />
            </div>
          </div>

          {/* Carbs */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Carbs</span>
              <span className="text-slate-700 dark:text-slate-350">{carbs}g / {targetCarbs}g</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-sky h-full rounded-full" style={{ width: `${(carbs/targetCarbs)*100}%` }} />
            </div>
          </div>

          {/* Fat */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Fat</span>
              <span className="text-slate-700 dark:text-slate-350">{fat}g / {targetFat}g</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
              <div className="bg-brand-coral h-full rounded-full" style={{ width: `${(fat/targetFat)*100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Link */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="bg-brand-sky/10 text-brand-sky p-2.5 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-outfit text-sm font-semibold">Ready to Scan?</h4>
            <p className="text-xs text-slate-400 mt-0.5">Let Gemini analyze your food photo instantly</p>
          </div>
        </div>
        <Link 
          href="/camera"
          className="bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 p-2 rounded-xl transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

    </div>
  );
}
