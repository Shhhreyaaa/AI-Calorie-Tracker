"use client";

import React, { useState } from "react";
import { PlusCircle, Clock, Trash2, Calendar } from "lucide-react";
import Image from "next/image";

export default function DiaryPage() {
  const [meals, setMeals] = useState([
    {
      id: 1,
      name: "Oatmeal with Blueberries & Honey",
      time: "8:15 AM",
      calories: 340,
      protein: 12,
      carbs: 58,
      fat: 6,
      category: "Breakfast"
    },
    {
      id: 2,
      name: "Avocado Salmon Salad",
      time: "12:42 PM",
      calories: 420,
      protein: 28,
      carbs: 12,
      fat: 18,
      category: "Lunch"
    },
    {
      id: 3,
      name: "Whey Protein & Banana Shake",
      time: "4:30 PM",
      calories: 280,
      protein: 30,
      carbs: 32,
      fat: 3,
      category: "Snack"
    }
  ]);

  const deleteMeal = (id: number) => {
    setMeals(prev => prev.filter(meal => meal.id !== id));
  };

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Food Diary</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Timeline Logs</h2>
        </div>
        <button className="bg-brand-green/10 text-brand-green p-2 rounded-xl hover:bg-brand-green/20 transition-all">
          <PlusCircle className="w-5 h-5" />
        </button>
      </div>

      {/* Aggregate nutrition card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Calories</span>
          <span className="font-outfit text-base font-bold mt-1 text-slate-800 dark:text-slate-200">{totalCalories} kcal</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Protein</span>
          <span className="font-outfit text-base font-bold mt-1 text-slate-850 dark:text-slate-300">{totalProtein}g</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Carbs</span>
          <span className="font-outfit text-base font-bold mt-1 text-slate-850 dark:text-slate-300">{totalCarbs}g</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Fat</span>
          <span className="font-outfit text-base font-bold mt-1 text-slate-850 dark:text-slate-300">{totalFat}g</span>
        </div>
      </div>

      {/* Timeline items list */}
      <div className="space-y-4">
        {meals.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
            <p className="text-xs text-slate-400">No meals logged for today yet.</p>
          </div>
        ) : (
          meals.map((meal) => (
            <div 
              key={meal.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-4 shadow-premium dark:shadow-premium-dark flex justify-between items-center gap-4 group hover:translate-y-[-1px] transition-all"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 px-2 py-1 rounded-lg mt-0.5 shrink-0">
                  {meal.category}
                </span>
                <div className="min-w-0">
                  <h4 className="font-outfit text-sm font-semibold truncate text-slate-800 dark:text-slate-150">
                    {meal.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{meal.time}</span>
                    <span className="mx-1">•</span>
                    <span className="text-brand-green font-semibold">{meal.calories} kcal</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {meal.protein}g P | {meal.carbs}g C | {meal.fat}g F
                </div>
                <button 
                  onClick={() => deleteMeal(meal.id)}
                  className="text-slate-350 hover:text-brand-coral p-1.5 rounded-lg hover:bg-brand-coral/5 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
