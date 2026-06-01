"use client";

import React, { useState, useEffect } from "react";
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

export default function DiaryPage() {
  const [loading, setLoading] = useState(true);
  const [meals, setMeals] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any | null>(null);

  // Editing form states
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [editCalories, setEditCalories] = useState(0);
  const [editProtein, setEditProtein] = useState(0);
  const [editCarbs, setEditCarbs] = useState(0);
  const [editFat, setEditFat] = useState(0);

  const fetchMeals = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", today.toISOString())
        .order("logged_at", { ascending: true });

      if (data) {
        setMeals(data);
      }
    } catch (err) {
      console.error("Diary load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeals();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteMealLog(id);
      await fetchMeals();
    } catch (err) {
      alert("Failed to delete log.");
    } finally {
      setLoading(false);
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
      setLoading(true);
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
      await fetchMeals();
    } catch (err) {
      alert("Failed to update meal log.");
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Loading diary timeline...</span>
      </div>
    );
  }

  // Categories configurations
  const categories = [
    { name: "Breakfast", icon: Coffee, color: "text-[#0EA5E9] bg-[#0EA5E9]/10" },
    { name: "Lunch", icon: Sun, color: "text-[#10B981] bg-[#10B981]/10" },
    { name: "Dinner", icon: Moon, color: "text-[#8B5CF6] bg-[#8B5CF6]/10" },
    { name: "Snack", icon: Cookie, color: "text-[#F43F5E] bg-[#F43F5E]/10" },
  ];

  return (
    <div className="space-y-6">
      
      {/* Edit Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-outfit text-base font-bold">Edit Meal Entry</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-650">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Food Title</label>
                <input 
                  type="text" required value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-brand-green rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Category</label>
                <select 
                  value={editType} onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-brand-green rounded-xl px-3 py-2 text-xs outline-none"
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Calories</label>
                  <input 
                    type="number" required value={editCalories} onChange={(e) => setEditCalories(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Protein (g)</label>
                  <input 
                    type="number" required value={editProtein} onChange={(e) => setEditProtein(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Carbs (g)</label>
                  <input 
                    type="number" required value={editCarbs} onChange={(e) => setEditCarbs(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Fat (g)</label>
                  <input 
                    type="number" required value={editFat} onChange={(e) => setEditFat(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3 px-4 rounded-xl shadow-glow transition-all"
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
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Timeline Logs</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>June 1, 2026</span>
        </div>
      </div>

      {/* Daily Nutrients Aggregation Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark grid grid-cols-4 gap-2 text-center">
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Calories</span>
          <span className="font-outfit text-xs font-extrabold mt-1 text-slate-800 dark:text-slate-200">{totalCalories} kcal</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Protein</span>
          <span className="font-outfit text-xs font-extrabold mt-1 text-slate-800 dark:text-slate-200">{totalProtein}g</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Carbs</span>
          <span className="font-outfit text-xs font-extrabold mt-1 text-slate-800 dark:text-slate-200">{totalCarbs}g</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-slate-405 font-bold uppercase tracking-wider">Fat</span>
          <span className="font-outfit text-xs font-extrabold mt-1 text-slate-800 dark:text-slate-200">{totalFat}g</span>
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
                <span className={`p-2 rounded-xl flex items-center justify-center ${cat.color}`}>
                  <CatIcon className="w-4 h-4" />
                </span>
                <h3 className="font-outfit text-base font-bold">{cat.name}</h3>
                <span className="text-slate-400 text-xs font-semibold">({catMeals.length})</span>
              </div>

              {/* Render items or empty banner */}
              {catMeals.length === 0 ? (
                <div className="bg-white/40 dark:bg-slate-900/40 border border-slate-100/50 dark:border-slate-800/40 border-dashed rounded-2xl py-5 text-center text-xs text-slate-400">
                  No {cat.name.toLowerCase()} entries logged.
                </div>
              ) : (
                <div className="space-y-3">
                  {catMeals.map((meal) => (
                    <div 
                      key={meal.id}
                      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-3.5 shadow-premium dark:shadow-premium-dark flex items-center justify-between gap-3 group hover:translate-y-[-1px] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Food Thumb */}
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 bg-slate-50">
                          <Image 
                            src={meal.image_url || "/images/avocado_toast.png"} 
                            alt={meal.food_name} 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-outfit text-xs font-bold truncate text-slate-800 dark:text-slate-200">
                            {meal.food_name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-405 font-bold uppercase tracking-wider">
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
                        <div className="text-right text-[10px] font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {meal.protein}g P | {meal.carbs}g C | {meal.fat}g F
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => openEditModal(meal)}
                            className="text-slate-350 hover:text-brand-green p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(meal.id)}
                            className="text-slate-350 hover:text-brand-coral p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
