"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Trash2,
  Edit3,
  Loader2,
  X,
  Sparkles,
  Search
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { deleteMealLog, updateMealLog } from "@/app/meals/actions";
import { useApp } from "@/lib/context/AppContext";

export default function HistoryPage() {
  const { meals: allMeals, loading: contextLoading, refreshAll } = useApp();
  const [updating, setUpdating] = useState(false);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<"Breakfast" | "Lunch" | "Dinner" | "Snack">("Breakfast");
  const [editCalories, setEditCalories] = useState(0);
  const [editProtein, setEditProtein] = useState(0);
  const [editCarbs, setEditCarbs] = useState(0);
  const [editFat, setEditFat] = useState(0);

  // Group meals chronologically in local time zone
  const groupedMeals = useMemo(() => {
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

    const today = new Date();
    const todayStr = getLocalDateStr(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Grouping structure
    const groups: { [key: string]: any[] } = {
      "Today": [],
      "Yesterday": [],
      "Last 7 Days": [],
      "Last 30 Days": [],
      "Older": []
    };

    // Filter by search query first
    const filteredMeals = allMeals.filter(m => 
      m.food_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.meal_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filteredMeals.forEach((meal) => {
      const mealDate = new Date(meal.logged_at);
      const mealDateStr = getLocalDateStr(mealDate);

      if (mealDateStr === todayStr) {
        groups["Today"].push(meal);
      } else if (mealDateStr === yesterdayStr) {
        groups["Yesterday"].push(meal);
      } else if (mealDate >= sevenDaysAgo) {
        groups["Last 7 Days"].push(meal);
      } else if (mealDate >= thirtyDaysAgo) {
        groups["Last 30 Days"].push(meal);
      } else {
        groups["Older"].push(meal);
      }
    });

    return groups;
  }, [allMeals, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meal log?")) return;
    try {
      setUpdating(true);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await deleteMealLog(id, tz);
      await refreshAll();
    } catch (err) {
      alert("Failed to delete meal log.");
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (meal: any) => {
    setEditingMeal(meal);
    setEditName(meal.food_name);
    setEditType(meal.meal_type || "Breakfast");
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
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await updateMealLog(editingMeal.id, {
        food_name: editName,
        meal_type: editType,
        calories: editCalories,
        protein: editProtein,
        carbs: editCarbs,
        fat: editFat
      }, tz);
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

  // Category Icon components
  const getCategoryDetails = (type: string) => {
    const categoryLower = (type || "").toLowerCase();
    if (categoryLower.includes("breakfast")) {
      return { icon: Coffee, color: "text-[#0EA5E9] bg-[#0EA5E9]/10 border-shadow border-[#0EA5E9]/20" };
    }
    if (categoryLower.includes("lunch")) {
      return { icon: Sun, color: "text-[#10B981] bg-[#10B981]/10 border-shadow border-[#10B981]/20" };
    }
    if (categoryLower.includes("dinner")) {
      return { icon: Moon, color: "text-[#8B5CF6] bg-[#8B5CF6]/10 border-shadow border-[#8B5CF6]/20" };
    }
    return { icon: Cookie, color: "text-[#F43F5E] bg-[#F43F5E]/10 border-shadow border-[#F43F5E]/20" };
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in text-white">
      
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
                disabled={updating}
                className="w-full bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-glow transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5"
              >
                {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Changes</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Link 
            href="/diary" 
            className="bg-slate-900 border border-white/10 p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Timeline logs</span>
            <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Meal Log History</h2>
          </div>
        </div>

        <button 
          onClick={refreshAll}
          disabled={loading}
          className="flex items-center gap-1.5 bg-slate-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <Loader2 className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by food name or category (e.g. Avocado, Breakfast)..."
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl glass-input outline-none placeholder:text-slate-500 text-white"
        />
      </div>

      {/* Categories lists container */}
      <div className="space-y-8">
        {Object.keys(groupedMeals).map((groupName) => {
          const groupList = groupedMeals[groupName];
          if (groupList.length === 0) return null;

          return (
            <div key={groupName} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Calendar className="w-4 h-4 text-brand-green" />
                <h3 className="font-outfit text-sm font-bold text-white uppercase tracking-wider">{groupName}</h3>
                <span className="text-[10px] bg-slate-900 text-slate-400 font-bold px-2 py-0.5 rounded-full border border-white/5">
                  {groupList.length} meal{groupList.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {groupList.map((meal) => {
                  const categoryDetails = getCategoryDetails(meal.meal_type);
                  const CatIcon = categoryDetails.icon;
                  
                  // Confidence display logic
                  const confidenceScore = meal.confidence !== undefined && meal.confidence !== null 
                    ? Math.round(Number(meal.confidence) * 100) 
                    : 95;

                  return (
                    <div 
                      key={meal.id}
                      className="glass-panel glass-panel-hover border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-4 group"
                    >
                      {/* Left: thumb and title details */}
                      <div className="flex items-center gap-3 min-w-0">
                        {meal.image_url ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 bg-slate-900/40">
                            <Image 
                              src={meal.image_url} 
                              alt={meal.food_name} 
                              fill 
                              sizes="(max-width: 768px) 48px, 48px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${categoryDetails.color}`}>
                            <CatIcon className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-outfit text-xs font-bold truncate text-white">
                              {meal.food_name}
                            </h4>
                            <span className="text-[8px] bg-slate-900 text-slate-400 border border-white/5 font-extrabold px-1.5 py-0.5 rounded-md truncate uppercase">
                              {meal.meal_type || "Snack"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-450 font-bold uppercase tracking-wider">
                            <span className="text-brand-green">{meal.calories} kcal</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> 
                              {new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span>•</span>
                            <span className="text-purple-400 flex items-center gap-0.5">
                              <Sparkles className="w-3 h-3" />
                              <span>{confidenceScore}% confidence</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: macros and edit/delete actions */}
                      <div className="flex items-center gap-3">
                        <div className="text-right text-[10px] font-bold text-slate-400 whitespace-nowrap hidden sm:block">
                          {meal.protein}g P | {meal.carbs}g C | {meal.fat}g F
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button 
                            onClick={() => openEditModal(meal)}
                            className="text-slate-400 hover:text-brand-green p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Edit meal entry"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(meal.id)}
                            className="text-slate-400 hover:text-brand-coral p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="Delete meal entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty state fallback if search yielded no matches or zero total meals logged */}
        {allMeals.length === 0 ? (
          <div className="glass-panel border-white/5 rounded-3xl p-10 text-center space-y-3">
            <Calendar className="w-10 h-10 text-brand-green mx-auto animate-pulse" />
            <h3 className="font-outfit text-sm font-bold text-slate-200">No Meals Logged Yet</h3>
            <p className="text-xs text-slate-450 max-w-sm mx-auto leading-relaxed">
              Scan your plate with the camera snapshot or use manual inputs in the food diary log to construct your history dashboard.
            </p>
            <Link 
              href="/diary" 
              className="inline-block bg-brand-green hover:bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-glow transition-all active:scale-95"
            >
              Go to Food Diary
            </Link>
          </div>
        ) : (
          Object.keys(groupedMeals).every(k => groupedMeals[k].length === 0) && (
            <div className="p-10 text-center border border-dashed border-white/5 rounded-3xl text-xs text-slate-450 italic">
              No historical matches found for search query &ldquo;{searchQuery}&rdquo;.
            </div>
          )
        )}
      </div>

    </div>
  );
}
