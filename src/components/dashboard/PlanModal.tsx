"use client";

import React from "react";
import { Zap, X, Loader2 } from "lucide-react";

interface PlanModalProps {
  show: boolean;
  onClose: () => void;
  loading: boolean;
  data: any;
}

export default function PlanModal({
  show,
  onClose,
  loading,
  data
}: PlanModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel border-white/10 rounded-[32px] p-6 w-full max-w-md shadow-2xl animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="font-outfit text-lg font-bold flex items-center gap-1.5 text-white">
            <Zap className="w-5 h-5 text-amber-500 animate-bounce" /> AI Tomorrow Meal Planner
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-slate-405"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Planning tomorrow's meals...</span>
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs">
            <p className="text-slate-400 leading-relaxed mb-2">
              Here is your structured meal plan for tomorrow, optimized to hit your calorie and protein targets:
            </p>

            {/* Meals list */}
            {["breakfast", "lunch", "dinner", "snacks"].map((mealKey) => {
              const meal = data[mealKey];
              const labelMap: any = {
                breakfast: "Breakfast 🥣",
                lunch: "Lunch 🍛",
                dinner: "Dinner 🍲",
                snacks: "Snacks & Drinks 🍎"
              };
              
              if (!meal) return null;

              return (
                <div key={mealKey} className="bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center border-b border-white/5 pb-1.5">
                    <span className="font-outfit font-extrabold text-slate-200">{labelMap[mealKey]}</span>
                    <span className="text-brand-green font-bold">{meal.calories} kcal</span>
                  </div>
                  <p className="text-slate-305 font-semibold leading-relaxed">{meal.name}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    <span>Protein: {meal.protein}g</span>
                    <span>Carbs: {meal.carbs}g</span>
                    <span>Fat: {meal.fat}g</span>
                  </div>
                </div>
              );
            })}

            <div className="pt-2 border-t border-white/5 text-[10px] text-slate-450 text-center font-semibold">
              Values are estimated based on standard portions
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-6">Could not generate tomorrow's meal plan.</p>
        )}
      </div>
    </div>
  );
}
