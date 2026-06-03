"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  PlusCircle, 
  Clock, 
  Trash2, 
  Edit3, 
  Calendar,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Loader2,
  X,
  Check
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { deleteMealLog, updateMealLog } from "@/app/meals/actions";
import { useApp } from "@/lib/context/AppContext";
import Link from "next/link";

export default function DiaryPage() {
  const { meals: allMeals, loading: contextLoading, refreshAll } = useApp();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [updating, setUpdating] = useState(false);

  // Editing form states
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [editCalories, setEditCalories] = useState(0);
  const [editProtein, setEditProtein] = useState(0);
  const [editCarbs, setEditCarbs] = useState(0);
  const [editFat, setEditFat] = useState(0);

  // Derive local today's meals from context cache
  const meals = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const getLocalDateStr = (date: Date) => {
      try {
        const parts = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(date);
        const year = parts.find(p => p.type === "year")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const day = parts.find(p => p.type === "day")?.value;
        return `${year}-${month}-${day}`;
      } catch (e) {
        return date.toISOString().split("T")[0];
      }
    };
    const todayStr = getLocalDateStr(new Date());
    return allMeals.filter(m => getLocalDateStr(new Date(m.logged_at)) === todayStr);
  }, [allMeals]);

  useEffect(() => {
    setFormattedDate(new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setUpdating(true);
      await deleteMealLog(id);
      await refreshAll();
    } catch (err) {
      alert("Failed to delete log.");
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (meal: any) => {
    setEditingMeal(meal);
    setEditName(meal.food_name);
    setEditType(meal.meal_type);
    setEditCalories(meal.calories);
    setEditProtein(meal.protein);
    setEditCarbs(meal.carbs);
    setEditFat(meal.fat);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeal) return;

    try {
      setUpdating(true);
      await updateMealLog(editingMeal.id, {
        food_name: editName,
        meal_type: editType,
        calories: editCalories,
        protein: editProtein,
        carbs: editCarbs,
        fat: editFat
      });
      setIsEditModalOpen(false);
      setEditingMeal(null);
      await refreshAll();
    } catch (err) {
      alert("Failed to update meal log.");
    } finally {
      setUpdating(false);
    }
  };

  const loading = contextLoading || updating;

  // Grouping helpers
  const getMealsByCategory = (category: string) => {
    return meals.filter(m => m.meal_type === category);
  };

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);

  if (loading && meals.length === 0) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-6 w-36 bg-slate-800 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded-xl" />
        </div>

        {/* Consumed Macros Header Skeleton */}
        <div className="glass-panel rounded-[32px] p-5 h-24 bg-slate-900/20 border-white/5" />

        {/* 4 categories skeletons */}
        <div className="space-y-4">
          {["Breakfast", "Lunch", "Dinner", "Snack"].map((cat) => (
            <div key={cat} className="space-y-3">
              <div className="h-4 w-28 bg-slate-800 rounded" />
              <div className="glass-panel rounded-2xl p-4 h-20 bg-slate-900/10 border-white/5 flex items-center justify-between" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Categories configurations
  const categories = [
    { name: "Breakfast", icon: Coffee, color: "text-[#0EA5E9] bg-[#0EA5E9]/10 border border-[#0EA5E9]/20" },
    { name: "Lunch", icon: Sun, color: "text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20" },
    { name: "Dinner", icon: Moon, color: "text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20" },
    { name: "Snack", icon: Cookie, color: "text-[#F43F5E] bg-[#F43F5E]/10 border border-[#F43F5E]/20" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Edit Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel border-white/10 rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit text-base font-bold text-white">Edit Meal Entry</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Food Title</label>
                <input 
                  type="text" 
                  required 
                  value={editName} 
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-green/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Category</label>
                <select 
                  value={editType} 
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full glass-input rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-green/30 cursor-pointer"
                >
                  <option value="Breakfast" className="bg-slate-900 text-white">Breakfast</option>
                  <option value="Lunch" className="bg-slate-900 text-white">Lunch</option>
                  <option value="Dinner" className="bg-slate-900 text-white">Dinner</option>
                  <option value="Snack" className="bg-slate-900 text-white">Snack</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Calories</label>
                  <input 
                    type="number" 
                    required 
                    value={editCalories} 
                    onChange={(e) => setEditCalories(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-green/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Protein (g)</label>
                  <input 
                    type="number" 
                    required 
                    value={editProtein} 
                    onChange={(e) => setEditProtein(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-green/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Carbs (g)</label>
                  <input 
                    type="number" 
                    required 
                    value={editCarbs} 
                    onChange={(e) => setEditCarbs(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-green/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fat (g)</label>
                  <input 
                    type="number" 
                    required 
                    value={editFat} 
                    onChange={(e) => setEditFat(Number(e.target.value))}
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs outline-none text-white focus:border-brand-green/30"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-glow transition-all active:scale-[0.98] cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Food Diary</span>
          <div className="flex items-center gap-2">
            <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Timeline Logs</h2>
            <Link 
              href="/history" 
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 px-2.5 py-1 rounded-full font-bold transition-all ml-2"
            >
              History &rarr;
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/60 border border-white/5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-brand-green" />
          <span>{formattedDate || "June 1, 2026"}</span>
        </div>
      </div>

      {/* Daily Nutrients Aggregation Card */}
      <div className="glass-panel border-white/5 rounded-[32px] p-6 grid grid-cols-4 gap-4 text-center">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Calories</span>
          <span className="font-outfit text-xs font-extrabold mt-1.5 text-white">{totalCalories} kcal</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Protein</span>
          <span className="font-outfit text-xs font-extrabold mt-1.5 text-white">{totalProtein}g</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Carbs</span>
          <span className="font-outfit text-xs font-extrabold mt-1.5 text-white">{totalCarbs}g</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fat</span>
          <span className="font-outfit text-xs font-extrabold mt-1.5 text-white">{totalFat}g</span>
        </div>
      </div>

      {/* Diary categorized timelines */}
      <div className="space-y-6">
        {categories.map((cat) => {
          const catMeals = getMealsByCategory(cat.name);
          const CatIcon = cat.icon;

          return (
            <div key={cat.name} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl flex items-center justify-center border ${cat.color}`}>
                  <CatIcon className="w-4 h-4" />
                </span>
                <h3 className="font-outfit text-base font-bold text-white">{cat.name}</h3>
                <span className="text-slate-400 text-xs font-semibold">({catMeals.length})</span>
              </div>

              {/* Render items or empty banner */}
              {catMeals.length === 0 ? (
                <div className="glass-panel border-white/5 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-2 group transition-all hover:scale-[0.99] duration-300">
                  <div className={`p-2.5 rounded-2xl border ${cat.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                    <CatIcon className="w-5 h-5 stroke-[2.2px]" />
                  </div>
                  <div>
                    <h4 className="font-outfit text-xs font-bold text-slate-200">No {cat.name} logged</h4>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto leading-relaxed">
                      Use the AI Scanner to capture photos or log a quick meal.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {catMeals.map((meal) => (
                    <div 
                      key={meal.id}
                      className="glass-panel glass-panel-hover border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Food Thumb */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-900/40">
                          <Image 
                            src={meal.image_url || "/images/avocado_toast.png"} 
                            alt={meal.food_name} 
                            fill 
                            sizes="(max-width: 768px) 48px, 48px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-outfit text-xs font-bold truncate text-white">
                            {meal.food_name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                            <span className="text-brand-green">{meal.calories} kcal</span>
                            <span>•</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> 
                              {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-[10px] font-bold text-slate-400 whitespace-nowrap">
                          {meal.protein}g P | {meal.carbs}g C | {meal.fat}g F
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => openEditModal(meal)}
                            className="text-slate-400 hover:text-brand-green p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(meal.id)}
                            className="text-slate-400 hover:text-brand-coral p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
