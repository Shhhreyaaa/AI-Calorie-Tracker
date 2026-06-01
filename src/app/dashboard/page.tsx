"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Flame, 
  Plus, 
  Sparkles, 
  ChevronRight, 
  Calendar,
  Clock,
  PlusCircle,
  TrendingUp,
  AlertCircle
} from "lucide-react";

// Custom SVG Ring Component for Macros
interface MacroRingProps {
  percentage: number;
  label: string;
  amount: string;
  target: string;
  colorClass: string;
  glowClass: string;
  strokeColor: string;
}

function MacroRing({ 
  percentage, 
  label, 
  amount, 
  target, 
  colorClass, 
  glowClass,
  strokeColor 
}: MacroRingProps) {
  const radius = 32;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="bg-slate-50/50 dark:bg-slate-850/40 border border-slate-100/60 dark:border-slate-800/40 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">{label}</span>
      
      {/* SVG Circular Progress Ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Inside Text */}
        <div className="absolute flex flex-col items-center">
          <span className="font-outfit text-xs font-bold text-slate-800 dark:text-slate-200">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="font-outfit text-sm font-bold text-slate-805 dark:text-slate-205">{amount}</div>
        <div className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Target {target}</div>
      </div>
    </div>
  );
}

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
  
  // Macros
  const protein = 92;
  const targetProtein = 150;
  const carbs = 114;
  const targetCarbs = 200;
  const fat = 48;
  const targetFat = 65;

  const recentMeals = [
    {
      id: 1,
      name: "Avocado Toast with Egg",
      image: "/images/avocado_toast.png",
      time: "8:15 AM",
      calories: 320,
      macros: "14g P • 38g C • 12g F",
      category: "Breakfast"
    },
    {
      id: 2,
      name: "Avocado Salmon Salad",
      image: "/images/salmon_salad.png",
      time: "12:42 PM",
      calories: 420,
      macros: "28g P • 12g C • 18g F",
      category: "Lunch"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
          <Flame className="w-4 h-4 text-brand-coral fill-current" />
          Streak Incremented! Keep going 🔥
        </div>
      )}

      {/* Greeting Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Overview</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Today Summary</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>June 1, 2026</span>
        </div>
      </div>

      {/* Section 1 & 2: Daily and Remaining Calories Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Daily Calories Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-5 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[170px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consumed</span>
            <span className="bg-brand-green/10 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-lg">
              Goal: {targetCalories} kcal
            </span>
          </div>

          <div className="my-2">
            <div className="font-outfit text-3xl font-extrabold tracking-tight">
              {calories} <span className="text-xs font-medium text-slate-400">kcal</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-brand-green" /> 120 kcal more than yesterday
            </p>
          </div>

          {/* Linear progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-green h-full rounded-full transition-all duration-500" 
              style={{ width: `${(calories/targetCalories)*100}%` }}
            />
          </div>
        </div>

        {/* Remaining Calories Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-5 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[170px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining</span>
            <span className="bg-brand-sky/10 text-brand-sky text-[9px] font-bold px-2 py-0.5 rounded-lg">
              Active Deficit
            </span>
          </div>

          <div className="my-2">
            <div className="font-outfit text-3xl font-extrabold tracking-tight text-brand-green">
              {targetCalories - calories} <span className="text-xs font-medium text-slate-400">kcal left</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-brand-sky" /> Perfect pace for weight control
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                setCalories(prev => Math.min(prev + 150, targetCalories));
              }}
              className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Log Quick Eat
            </button>
            <button 
              onClick={() => setCalories(1320)}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[10px] font-semibold py-1.5 px-2.5 rounded-lg"
            >
              Reset
            </button>
          </div>
        </div>

      </div>

      {/* Section 3, 4, & 5: Macro Rings */}
      <div>
        <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Macronutrient Rings</h3>
        <div className="grid grid-cols-3 gap-3">
          <MacroRing 
            percentage={(protein/targetProtein)*100}
            label="Protein"
            amount={`${protein}g`}
            target={`${targetProtein}g`}
            colorClass="text-brand-green"
            glowClass="shadow-glow"
            strokeColor="#10B981"
          />
          <MacroRing 
            percentage={(carbs/targetCarbs)*100}
            label="Carbs"
            amount={`${carbs}g`}
            target={`${targetCarbs}g`}
            colorClass="text-brand-sky"
            glowClass=""
            strokeColor="#0EA5E9"
          />
          <MacroRing 
            percentage={(fat/targetFat)*100}
            label="Fat"
            amount={`${fat}g`}
            target={`${targetFat}g`}
            colorClass="text-brand-coral"
            glowClass=""
            strokeColor="#F43F5E"
          />
        </div>
      </div>

      {/* Section 6: Current Streak Widget */}
      <div 
        onClick={() => {
          setStreak(prev => prev + 1);
          setShowToast(true);
        }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-5 shadow-premium dark:shadow-premium-dark flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform group"
      >
        <div className="flex items-center gap-3">
          <span className="bg-brand-coral/10 text-brand-coral p-2.5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5 fill-current" />
          </span>
          <div>
            <h4 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-200">Current Streak</h4>
            <p className="text-xs text-slate-400 mt-0.5">Consecutive active calorie logs</p>
          </div>
        </div>
        <div className="font-outfit text-2xl font-black text-brand-coral">
          {streak} <span className="text-xs font-semibold text-slate-400">days</span>
        </div>
      </div>

      {/* Section 7: Recent Meals */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center">
          <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Meals logged</h3>
          <Link href="/diary" className="text-[10px] font-bold text-brand-green uppercase tracking-wider flex items-center gap-1">
            View Diary <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentMeals.map((meal) => (
            <div 
              key={meal.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3 shadow-premium dark:shadow-premium-dark flex items-center justify-between gap-3 group hover:translate-y-[-1px] transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800">
                  <Image 
                    src={meal.image} 
                    alt={meal.name} 
                    fill 
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-outfit text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                    {meal.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-405 font-bold uppercase tracking-wider">
                    <span>{meal.category}</span>
                    <span>•</span>
                    <span className="text-brand-green">{meal.calories} kcal</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-semibold">
                    <Clock className="w-3 h-3" /> {meal.time}
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                {meal.macros}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
