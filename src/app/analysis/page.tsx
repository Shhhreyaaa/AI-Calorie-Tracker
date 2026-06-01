"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Check, Edit3, ArrowLeft, RefreshCw, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function AnalysisPage() {
  const [calories, setCalories] = useState(420);
  const [protein, setProtein] = useState(28);
  const [carbs, setCarbs] = useState(12);
  const [fat, setFat] = useState(18);

  const [isSaved, setIsSaved] = useState(false);

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <Link href="/camera" className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AI Report</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Analysis Results</h2>
        </div>
      </div>

      {/* Main Analysis Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-premium dark:shadow-premium-dark">
        <div className="relative h-48 w-full">
          <Image 
            src="/images/salmon_salad.png" 
            alt="Avocado Salmon Salad" 
            fill 
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <h3 className="font-outfit text-lg font-bold">Avocado Salmon Salad</h3>
            <p className="text-[10px] text-slate-350 mt-0.5">Estimated by Gemini 1.5 Pro</p>
          </div>
        </div>

        {/* Adjustments Form */}
        <div className="p-5 space-y-4">
          <div>
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">Adjustment Panel</span>
            <p className="text-xs text-slate-400 mt-0.5">Drag to modify estimated values if needed.</p>
          </div>

          {/* Calorie slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Calories (kcal)</span>
              <span className="font-outfit font-bold text-brand-green">{calories} kcal</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full accent-brand-green h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Protein slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Protein (g)</span>
              <span className="font-outfit font-bold text-brand-green">{protein}g</span>
            </div>
            <input 
              type="range" 
              min="5" 
              max="80" 
              value={protein}
              onChange={(e) => setProtein(Number(e.target.value))}
              className="w-full accent-brand-green h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Carbs slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Carbohydrates (g)</span>
              <span className="font-outfit font-bold text-brand-sky">{carbs}g</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="150" 
              value={carbs}
              onChange={(e) => setCarbs(Number(e.target.value))}
              className="w-full accent-brand-sky h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Fat slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-500">Fat (g)</span>
              <span className="font-outfit font-bold text-brand-coral">{fat}g</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="60" 
              value={fat}
              onChange={(e) => setFat(Number(e.target.value))}
              className="w-full accent-brand-coral h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Action trigger */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
            <button 
              onClick={() => {
                setCalories(420);
                setProtein(28);
                setCarbs(12);
                setFat(18);
                setIsSaved(false);
              }}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-3 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
            </button>
            <button 
              onClick={() => setIsSaved(true)}
              className="flex-1 bg-brand-green hover:bg-emerald-600 active:scale-[0.98] text-white font-semibold text-xs py-3.5 px-4 rounded-xl shadow-glow transition-all flex items-center justify-center gap-2"
            >
              {isSaved ? (
                <>
                  <Check className="w-4 h-4" /> Logged Successfully!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" /> Confirm & Log Meal
                </>
              )}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
