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
  TrendingUp,
  AlertCircle,
  Loader2
} from "lucide-react";
import MacroRing from "@/components/dashboard/MacroRing";
import { createClient } from "@/lib/supabase/client";
import { saveMealLog } from "@/app/meals/actions";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [recentMeals, setRecentMeals] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);

  const [targets, setTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65
  });

  const fetchDashboardData = async () => {
    try {
      const supabase = createClient();
      
      // Get current authenticated user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch nutrition goals
      const { data: goalData } = await supabase
        .from("goals")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (goalData) {
        setTargets({
          calories: goalData.calories,
          protein: goalData.protein,
          carbs: goalData.carbs,
          fat: goalData.fat
        });
      }

      // 2. Fetch streaks data
      const { data: streakData } = await supabase
        .from("streaks")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (streakData) {
        setStreak(streakData.current_streak);
      }

      // 3. Fetch today's logged meals
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: mealsData } = await supabase
        .from("meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", today.toISOString())
        .order("logged_at", { ascending: false });

      if (mealsData) {
        // Calculate daily aggregates
        const sumCalories = mealsData.reduce((sum, m) => sum + m.calories, 0);
        const sumProtein = mealsData.reduce((sum, m) => sum + m.protein, 0);
        const sumCarbs = mealsData.reduce((sum, m) => sum + m.carbs, 0);
        const sumFat = mealsData.reduce((sum, m) => sum + m.fat, 0);

        setCalories(sumCalories);
        setProtein(sumProtein);
        setCarbs(sumCarbs);
        setFat(sumFat);
        
        // Map to display items
        setRecentMeals(mealsData.map(m => ({
          id: m.id,
          name: m.food_name,
          image: m.image_url || "/images/avocado_toast.png", // fallback image
          time: new Date(m.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          calories: m.calories,
          macros: `${m.protein}g P • ${m.carbs}g C • ${m.fat}g F`,
          category: m.calories > 350 ? "Lunch" : "Snack"
        })));
      }

    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Handle Toast popup timeouts
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleQuickLog = async () => {
    try {
      setLoading(true);
      await saveMealLog({
        food_name: "Quick Snack Log (Simulated)",
        calories: 150,
        protein: 10,
        carbs: 20,
        fat: 4
      });
      setShowToast(true);
      await fetchDashboardData(); // Refresh totals instantly from DB
    } catch (err) {
      alert("Failed to insert quick log.");
    } finally {
      setLoading(false);
    }
  };

  const remainingCalories = Math.max(targets.calories - calories, 0);
  const caloriePercentage = Math.min((calories / targets.calories) * 100, 100);

  if (loading && recentMeals.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
        <span className="text-xs text-slate-400 font-semibold">Updating macro logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast alert */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
          <Flame className="w-4 h-4 text-brand-coral fill-current" />
          Meal logged to database! Streak prolonged 🔥
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

      {/* Daily and Remaining Calories Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Daily Calories Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[28px] p-5 shadow-premium dark:shadow-premium-dark flex flex-col justify-between min-h-[170px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Consumed</span>
            <span className="bg-brand-green/10 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-lg">
              Goal: {targets.calories} kcal
            </span>
          </div>

          <div className="my-2">
            <div className="font-outfit text-3xl font-extrabold tracking-tight">
              {calories} <span className="text-xs font-medium text-slate-400">kcal</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-brand-green" /> Real-time active calorie updates
            </p>
          </div>

          {/* Linear progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-850 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-brand-green h-full rounded-full transition-all duration-500" 
              style={{ width: `${caloriePercentage}%` }}
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
              {remainingCalories} <span className="text-xs font-medium text-slate-400">kcal left</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-brand-sky" /> Verified from Supabase database
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleQuickLog}
              disabled={loading}
              className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1"
            >
              {loading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Log Quick Eat
                </>
              )}
            </button>
            <button 
              onClick={fetchDashboardData}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 text-[10px] font-semibold py-1.5 px-2.5 rounded-lg"
            >
              Refresh
            </button>
          </div>
        </div>

      </div>

      {/* Macro Rings */}
      <div>
        <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Macronutrient Rings</h3>
        <div className="grid grid-cols-3 gap-3">
          <MacroRing 
            value={protein}
            target={targets.protein}
            label="Protein"
            strokeColor="#10B981"
            glowColor="rgba(16, 185, 129, 0.2)"
          />
          <MacroRing 
            value={carbs}
            target={targets.carbs}
            label="Carbs"
            strokeColor="#0EA5E9"
            glowColor="rgba(14, 165, 233, 0.2)"
          />
          <MacroRing 
            value={fat}
            target={targets.fat}
            label="Fat"
            strokeColor="#F43F5E"
            glowColor="rgba(244, 63, 94, 0.2)"
          />
        </div>
      </div>

      {/* Current Streak Widget */}
      <div 
        onClick={handleQuickLog}
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

      {/* Recent Meals */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center">
          <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider">Recent Meals logged</h3>
          <Link href="/diary" className="text-[10px] font-bold text-brand-green uppercase tracking-wider flex items-center gap-1">
            View Diary <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentMeals.length === 0 ? (
            <div className="text-center py-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6">
              <p className="text-xs text-slate-400">No meals logged for today yet.</p>
            </div>
          ) : (
            recentMeals.slice(0, 3).map((meal) => (
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

                <div className="text-right text-[10px] font-semibold text-slate-405 dark:text-slate-500 shrink-0">
                  {meal.macros}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
