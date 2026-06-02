"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Loader2,
  Award,
  Heart,
  Activity,
  ListTodo,
  Scale,
  X,
  Brain,
  Zap,
  ChevronDown,
  ChevronUp,
  Lightbulb
} from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { saveMealLog } from "@/app/meals/actions";
import { calculateHealthScore } from "@/lib/utils/healthScore";
import { useApp } from "@/lib/context/AppContext";

const MacroRing = dynamic(() => import("@/components/dashboard/MacroRing"), {
  ssr: false,
  loading: () => (
    <div className="glass-panel rounded-[24px] p-5 flex flex-col items-center justify-center text-center h-44 w-full animate-pulse bg-slate-900/40">
      <div className="h-3 w-16 bg-slate-800 rounded mb-3" />
      <div className="h-16 w-16 rounded-full border-2 border-slate-800 border-t-brand-green animate-spin" />
    </div>
  )
});

const WeightModal = dynamic(() => import("@/components/dashboard/WeightModal"), { ssr: false });
const AnalysisModal = dynamic(() => import("@/components/dashboard/AnalysisModal"), { ssr: false });
const PlanModal = dynamic(() => import("@/components/dashboard/PlanModal"), { ssr: false });

function getGreeting() {
  const hr = new Date().getHours();
  if (hr < 12) return "Good Morning";
  if (hr < 18) return "Good Afternoon";
  return "Good Evening";
}

function AnimatedCounter({ value, duration = 800 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp: number | null = null;
    let cancelled = false;
    const step = (timestamp: number) => {
      if (cancelled) return;
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
    return () => {
      cancelled = true;
    };
  }, [value, duration]);
  return <>{count}</>;
}

export default function Dashboard() {
  const { 
    profile, 
    streak: streakData, 
    meals, 
    weightLogs, 
    loading: contextLoading, 
    refreshAll, 
    optimisticAddMeal, 
    optimisticAddWeight 
  } = useApp();

  const [showToast, setShowToast] = useState(false);
  const [showScoreDetails, setShowScoreDetails] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);

  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planData, setPlanData] = useState<any>(null);

  const greeting = useMemo(() => getGreeting(), []);

  // Compute targets from unified profile
  const targets = useMemo(() => {
    return {
      calories: profile?.daily_calorie_target ?? 2000,
      protein: profile?.protein_goal ?? 150,
      carbs: profile?.carbs_goal ?? 200,
      fat: profile?.fat_goal ?? 65
    };
  }, [profile]);

  const isOnboarded = useMemo(() => {
    if (!profile) return true;
    return !!profile.onboarding_completed;
  }, [profile]);

  const streak = useMemo(() => streakData?.current_streak || 0, [streakData]);
  const uniqueLoggedDaysCount = useMemo(() => streakData?.unique_logged_days?.length || 0, [streakData]);
  const weightLogsCount = useMemo(() => weightLogs?.length || 0, [weightLogs]);

  // Compute today's meals
  const todayMeals = useMemo(() => {
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
    return meals.filter(m => getLocalDateStr(new Date(m.logged_at)) === todayStr);
  }, [meals]);

  // Compute today's macro sums
  const calories = useMemo(() => todayMeals.reduce((sum, m) => sum + m.calories, 0), [todayMeals]);
  const protein = useMemo(() => todayMeals.reduce((sum, m) => sum + m.protein, 0), [todayMeals]);
  const carbs = useMemo(() => todayMeals.reduce((sum, m) => sum + m.carbs, 0), [todayMeals]);
  const fat = useMemo(() => todayMeals.reduce((sum, m) => sum + m.fat, 0), [todayMeals]);

  // Mapped recent meals for rendering
  const recentMeals = useMemo(() => {
    return todayMeals.map(m => ({
      id: m.id,
      name: m.food_name,
      image: m.image_url || "/images/avocado_toast.png",
      time: new Date(m.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      calories: m.calories,
      macros: `${m.protein}g P • ${m.carbs}g C • ${m.fat}g F`,
      category: m.meal_type || (m.calories > 350 ? "Lunch" : "Snack")
    }));
  }, [todayMeals]);

  // Compute health score
  const healthScoreInfo = useMemo(() => {
    if (!profile) return null;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return calculateHealthScore(meals, targets, streak, tz);
  }, [meals, targets, streak, profile]);

  // Compute weight statistics
  const weightStats = useMemo(() => {
    if (!weightLogs || weightLogs.length === 0) return null;
    
    const currentW = Number(weightLogs[0].weight);
    let weeklyDiff = 0;
    let monthlyDiff = 0;
    
    const nowMs = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
    
    const weekEntry = weightLogs.find(w => (nowMs - new Date(w.created_at).getTime()) >= oneWeekMs);
    const monthEntry = weightLogs.find(w => (nowMs - new Date(w.created_at).getTime()) >= oneMonthMs);
    
    if (weekEntry) {
      weeklyDiff = currentW - Number(weekEntry.weight);
    }
    if (monthEntry) {
      monthlyDiff = currentW - Number(monthEntry.weight);
    }
    
    return {
      current: currentW,
      weeklyChange: weeklyDiff,
      monthlyChange: monthlyDiff,
      logs: weightLogs
    };
  }, [weightLogs]);

  // Level and XP computing
  const xpInfo = useMemo(() => {
    const totalXP = (uniqueLoggedDaysCount * 50) + (streak * 100) + (weightLogsCount * 100);
    const level = Math.floor(totalXP / 500) + 1;
    const progressPercent = (totalXP % 500) / 500 * 100;
    return { level, progressPercent };
  }, [uniqueLoggedDaysCount, streak, weightLogsCount]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleQuickLog = useCallback(async () => {
    try {
      const mealData = {
        food_name: "Quick Snack Log (Simulated)",
        calories: 150,
        protein: 10,
        carbs: 20,
        fat: 4,
        meal_type: "Snack" as const
      };
      
      // 1. Optimistic Add
      optimisticAddMeal(mealData);
      setShowToast(true);

      // 2. Background DB Insert
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await saveMealLog(mealData, tz);
    } catch (err) {
      alert("Failed to insert quick log.");
    }
  }, [optimisticAddMeal]);

  // Log weight handler
  const handleLogWeight = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) {
      alert("Please enter a valid number for weight.");
      return;
    }
    
    const weightNum = Number(newWeight);

    try {
      setLoggingWeight(true);
      // 1. Optimistic Add
      optimisticAddWeight(weightNum);
      setNewWeight("");
      setShowWeightModal(false);

      // 2. DB inserts in background
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        weight: weightNum,
        created_at: new Date().toISOString()
      });
      
      if (error) throw error;

      // Update current weight in users table for unified profile settings sync
      await supabase.from("users").update({
        current_weight: weightNum
      }).eq("id", user.id);

      await refreshAll();
    } catch (err: any) {
      console.error("Failed to log weight:", err);
      alert(err.message || "Failed to save weight.");
    } finally {
      setLoggingWeight(false);
    }
  }, [newWeight, optimisticAddWeight, refreshAll]);

  // Diet Analyzer handler
  const handleAnalyzeDay = useCallback(async () => {
    try {
      setLoadingAnalysis(true);
      setShowAnalysisModal(true);
      setAnalysisData(null);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch("/api/coach/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localMidnight: today.toISOString()
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAnalysisData(data.analysis);
      } else {
        alert(data.error || "Failed to analyze day.");
      }
    } catch (err) {
      console.error("Failed to run day analysis:", err);
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  // Meal Planner handler
  const handlePlanTomorrow = useCallback(async () => {
    try {
      setLoadingPlan(true);
      setShowPlanModal(true);
      setPlanData(null);
      
      const response = await fetch("/api/coach/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setPlanData(data.plan);
      } else {
        alert(data.error || "Failed to generate plan.");
      }
    } catch (err) {
      console.error("Failed to generate plan:", err);
    } finally {
      setLoadingPlan(false);
    }
  }, []);

  const remainingCalories = useMemo(() => Math.max(targets.calories - calories, 0), [targets.calories, calories]);
  const caloriePercentage = useMemo(() => Math.min((calories / targets.calories) * 100, 100), [calories, targets.calories]);

  const loading = contextLoading;

  if (loading && meals.length === 0) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-3 w-12 bg-slate-800 rounded" />
            <div className="h-6 w-32 bg-slate-800 rounded" />
          </div>
          <div className="h-8 w-24 bg-slate-800 rounded-xl" />
        </div>

        {/* Hero Card Skeleton */}
        <div className="glass-panel rounded-[32px] p-6 h-56 flex flex-col justify-between bg-slate-900/20 border-white/5">
          <div className="space-y-3">
            <div className="h-3 w-24 bg-slate-800 rounded" />
            <div className="h-8 w-48 bg-slate-800 rounded" />
            <div className="h-4 w-3/4 bg-slate-800 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-slate-800 rounded-full" />
            <div className="h-6 w-24 bg-slate-800 rounded-full" />
            <div className="h-6 w-28 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* Action Triggers Skeleton */}
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-slate-900/60 border border-white/5 rounded-2xl" />
          <div className="h-12 bg-slate-900/60 border border-white/5 rounded-2xl" />
        </div>

        {/* Calories Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel rounded-[28px] p-5 h-44 flex flex-col justify-between bg-slate-900/10 border-white/5">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-8 w-24 bg-slate-800 rounded" />
            <div className="h-2 bg-slate-800 rounded-full w-full" />
          </div>
          <div className="glass-panel rounded-[28px] p-5 h-44 flex flex-col justify-between bg-slate-900/10 border-white/5">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-8 w-24 bg-slate-800 rounded" />
            <div className="h-2 bg-slate-800 rounded-full w-full" />
          </div>
        </div>

        {/* Recent Meals Skeleton */}
        <div className="space-y-3">
          <div className="h-3 w-32 bg-slate-800 rounded" />
          <div className="space-y-2">
            <div className="glass-panel rounded-3xl p-3 h-16 bg-slate-900/10 border-white/5" />
            <div className="glass-panel rounded-3xl p-3 h-16 bg-slate-900/10 border-white/5" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative">
      
      {/* Toast alert */}
      {showToast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] border border-brand-coral/30 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in backdrop-blur-md">
          <Flame className="w-4 h-4 text-brand-coral fill-current" />
          Meal logged to database! Streak prolonged 🔥
        </div>
      )}

      {/* Dynamic Header */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-widest block">Dashboard</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Daily Digest</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/50 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400">
          <Calendar className="w-3.5 h-3.5 text-brand-green" />
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
      </div>

      {/* Onboarding Banner reminder */}
      {!isOnboarded && (
        <div className="glass-panel border-purple-500/30 bg-gradient-to-r from-[#1e1b4b]/30 to-purple-950/20 rounded-2xl p-4 flex justify-between items-center animate-fade-in">
          <div className="space-y-0.5">
            <span className="text-[9px] text-[#00e5ff] font-extrabold uppercase tracking-widest block">Onboarding Pending</span>
            <h4 className="text-xs font-bold text-white leading-tight">AI Personalized Targets</h4>
            <p className="text-[10px] text-slate-400 leading-snug mt-0.5">Configure your biometrics and goals via the Mifflin-St Jeor calculator.</p>
          </div>
          <Link 
            href="/onboarding" 
            className="bg-brand-green hover:bg-emerald-600 text-black font-extrabold text-[10px] px-3.5 py-2 rounded-xl shrink-0 flex items-center gap-1 transition-all shadow-glow"
          >
            <span>Start Onboarding</span>
            <ChevronRight className="w-3 h-3 stroke-[2.5px]" />
          </Link>
        </div>
      )}

      {/* Large Premium Hero Card */}
      <div className="glass-panel rounded-[32px] p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center justify-between border-brand-green/20 bg-gradient-to-br from-slate-900/40 via-slate-950/25 to-emerald-950/15 shadow-premium-dark animate-fade-in">
        {/* Inner Aurora Radial Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-brand-green/10 blur-[80px] pointer-events-none" />
        
        <div className="space-y-5 flex-1 w-full">
          <div>
            <span className="text-[9px] text-brand-green font-extrabold uppercase tracking-widest block mb-1">Vital Health Companion</span>
            <h2 className="font-outfit text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {profile?.full_name || "Athlete"}
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xl">
              {healthScoreInfo ? healthScoreInfo.explanation : "Track calorie targets, log meals, and consult the AI coach to compute your health index."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* XP Level indicator */}
            <Link 
              href="/streaks" 
              className="bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 hover:bg-[#8b5cf6]/20 transition-colors"
            >
              <span className="font-outfit text-xs font-black text-[#8b5cf6] flex items-center gap-1">
                🏆 Level {xpInfo.level}
              </span>
              <div className="w-12 bg-slate-900 h-1.5 rounded-full overflow-hidden shrink-0">
                <div 
                  className="bg-[#8b5cf6] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${xpInfo.progressPercent}%` }}
                />
              </div>
            </Link>

            {/* Streak count indicator */}
            <div className="bg-brand-coral/10 border border-brand-coral/20 rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-brand-coral fill-current animate-pulse" />
              <span className="font-outfit text-xs font-black text-brand-coral">
                <AnimatedCounter value={streak} /> Day Streak
              </span>
            </div>
            
            {/* Protein Intake Progress */}
            <div className="bg-brand-green/10 border border-brand-green/20 rounded-full px-3.5 py-1.5 flex items-center gap-1.5">
              <span className="font-outfit text-xs font-black text-brand-green">
                Protein: <AnimatedCounter value={protein} /> / {targets.protein}g
              </span>
              <div className="w-12 bg-slate-900 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-green h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((protein / targets.protein) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Health Score Dial */}
        {healthScoreInfo && (
          <div className="shrink-0 flex flex-col items-center justify-center p-5 bg-slate-950/60 rounded-3xl border border-white/5 backdrop-blur-md relative min-w-[140px]">
            <span className="text-[9px] text-slate-450 font-bold uppercase tracking-wider mb-2.5 block">Health Index</span>
            <div className="relative flex items-center justify-center w-28 h-28">
              <svg className="w-full h-full transform -rotate-90">
                <defs>
                  <linearGradient id="healthScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#34D399" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  className="stroke-slate-800/80"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  stroke="url(#healthScoreGrad)"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={2 * Math.PI * 46 * (1 - healthScoreInfo.healthScore / 100)}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{ 
                    transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))"
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="font-outfit text-3xl font-black text-white">
                  <AnimatedCounter value={healthScoreInfo.healthScore} />
                </span>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowScoreDetails(!showScoreDetails)}
              className="mt-3.5 flex items-center gap-1 text-[10px] text-brand-green font-bold focus:outline-none hover:underline cursor-pointer"
            >
              <span>{showScoreDetails ? "Hide Details" : "Score Breakdown"}</span>
              {showScoreDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Score Details Dropdown */}
      {healthScoreInfo && showScoreDetails && (
        <div className="glass-panel border-brand-green/20 rounded-[28px] p-5 space-y-4 animate-fade-in bg-slate-950/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Nutrition Adherence</div>
              <div className="font-outfit text-base font-extrabold mt-0.5 text-white">{healthScoreInfo.nutrition}/100</div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Protein Target</div>
              <div className="font-outfit text-base font-extrabold mt-0.5 text-white">{healthScoreInfo.protein}/100</div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Consistency</div>
              <div className="font-outfit text-base font-extrabold mt-0.5 text-white">{healthScoreInfo.consistency}/100</div>
            </div>
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-white/5">
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Streak Factor</div>
              <div className="font-outfit text-base font-extrabold mt-0.5 text-white">{healthScoreInfo.streakScore}/100</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-205 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Suggestions for Improvement:
            </h4>
            <ul className="list-disc list-inside text-xs text-slate-400 space-y-1.5 pl-1">
              {healthScoreInfo.tips.map((tip: string, index: number) => (
                <li key={index} className="leading-relaxed">{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Action Triggers */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleAnalyzeDay}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl py-3 px-4 text-xs font-bold shadow-glow active:scale-[0.98] transition-all cursor-pointer border border-emerald-400/10"
        >
          <Brain className="w-4 h-4" />
          <span>Analyze My Day</span>
        </button>
        <button 
          onClick={handlePlanTomorrow}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl py-3 px-4 text-xs font-bold shadow-glow active:scale-[0.98] transition-all cursor-pointer border border-sky-400/10"
        >
          <Zap className="w-4 h-4" />
          <span>Plan Tomorrow</span>
        </button>
      </div>

      {/* Daily and Remaining Calories Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Daily Calories Card */}
        <div className="glass-panel rounded-[28px] p-5 flex flex-col justify-between min-h-[170px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Consumed</span>
            <span className="bg-brand-green/10 text-brand-green text-[9px] font-bold px-2 py-0.5 rounded-lg border border-brand-green/20">
              Goal: {targets.calories} kcal
            </span>
          </div>

          <div className="my-2">
            <div className="font-outfit text-3xl font-extrabold tracking-tight text-white">
              <AnimatedCounter value={calories} /> <span className="text-xs font-medium text-slate-400">kcal</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-brand-green" /> Real-time active calorie updates
            </p>
          </div>

          {/* Linear progress bar */}
          <div className="w-full bg-slate-900/60 border border-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-400 to-brand-green h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]" 
              style={{ width: `${caloriePercentage}%` }}
            />
          </div>
        </div>

        {/* Remaining Calories Card */}
        <div className="glass-panel rounded-[28px] p-5 flex flex-col justify-between min-h-[170px]">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Remaining</span>
            <span className="bg-brand-sky/10 text-brand-sky text-[9px] font-bold px-2 py-0.5 rounded-lg border border-brand-sky/20">
              Active Deficit
            </span>
          </div>

          <div className="my-2">
            <div className="font-outfit text-3xl font-extrabold tracking-tight text-brand-green">
              <AnimatedCounter value={remainingCalories} /> <span className="text-xs font-medium text-slate-400">kcal left</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-semibold flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-brand-sky" /> Verified from Supabase database
            </p>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleQuickLog}
              disabled={loading}
              className="flex-1 bg-brand-green hover:bg-emerald-600 text-white font-semibold text-[10px] py-1.5 px-3 rounded-lg shadow-glow active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
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
              onClick={refreshAll}
              className="bg-slate-900/60 hover:bg-slate-800 text-slate-350 border border-white/5 text-[10px] font-semibold py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

      </div>

      {/* Macro Rings */}
      <div>
        <h3 className="font-outfit text-xs font-bold text-slate-405 uppercase tracking-widest mb-3 pl-1">Macronutrient Targets</h3>
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

      {/* Achievement Badges */}
      <div className="glass-panel rounded-[28px] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="bg-amber-500/10 text-amber-400 p-2.5 rounded-2xl flex items-center justify-center border border-amber-500/20">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <h4 className="font-outfit text-sm font-bold text-white">Gamified Badges</h4>
            <p className="text-xs text-slate-400 mt-0.5">Unlock targets to activate your achievements</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {/* Streak Master Badge */}
          <div className={`p-3.5 rounded-2xl flex flex-col items-center text-center border transition-all ${
            streak >= 3 
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]" 
              : "bg-slate-950/40 border-white/5 text-slate-500 opacity-50"
          }`}>
            <Flame className={`w-7 h-7 mb-2 ${streak >= 3 ? "fill-current animate-pulse text-amber-500" : "text-slate-550"}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Streak Master</span>
            <span className="text-[8px] text-slate-400 mt-1">{streak >= 3 ? "Unlocked" : "3-Day Streak Req."}</span>
          </div>

          {/* Protein Powerhouse */}
          <div className={`p-3.5 rounded-2xl flex flex-col items-center text-center border transition-all ${
            protein >= 100 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
              : "bg-slate-950/40 border-white/5 text-slate-500 opacity-50"
          }`}>
            <Award className={`w-7 h-7 mb-2 ${protein >= 100 ? "text-emerald-500 animate-bounce" : "text-slate-550"}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Protein Peak</span>
            <span className="text-[8px] text-slate-400 mt-1">{protein >= 100 ? "Unlocked" : "100g Protein Req."}</span>
          </div>

          {/* Health Hero */}
          <div className={`p-3.5 rounded-2xl flex flex-col items-center text-center border transition-all ${
            healthScoreInfo && healthScoreInfo.healthScore >= 80 
              ? "bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]" 
              : "bg-slate-950/40 border-white/5 text-slate-500 opacity-50"
          }`}>
            <Heart className={`w-7 h-7 mb-2 ${healthScoreInfo && healthScoreInfo.healthScore >= 80 ? "fill-current text-sky-405" : "text-slate-550"}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Health Hero</span>
            <span className="text-[8px] text-slate-400 mt-1">{(healthScoreInfo && healthScoreInfo.healthScore >= 80) ? "Unlocked" : "80+ Health Score"}</span>
          </div>
        </div>
      </div>

      {/* Weight Tracker Widget */}
      <div className="glass-panel rounded-[28px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="bg-brand-sky/10 text-brand-sky p-2.5 rounded-2xl flex items-center justify-center border border-brand-sky/20">
              <Scale className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-outfit text-sm font-bold text-white">Weight Tracker</h4>
              <p className="text-xs text-slate-400 mt-0.5">Log and track body composition changes</p>
            </div>
          </div>
          <button
            onClick={() => setShowWeightModal(true)}
            className="bg-brand-sky/10 hover:bg-brand-sky/20 text-brand-sky border border-brand-sky/20 font-bold text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-colors"
          >
            Log Weight
          </button>
        </div>

        {weightStats ? (
          <div className="grid grid-cols-3 gap-2 text-center border-t border-white/5 pt-3">
            <div>
              <span className="text-[9px] text-slate-405 font-bold uppercase tracking-widest block">Current</span>
              <span className="font-outfit text-sm font-extrabold text-white mt-0.5 block">
                {weightStats.current} kg
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest block">Weekly</span>
              <span className={`font-outfit text-sm font-extrabold mt-0.5 block ${
                weightStats.weeklyChange < 0 ? "text-brand-green" : weightStats.weeklyChange > 0 ? "text-rose-500" : "text-slate-500"
              }`}>
                {weightStats.weeklyChange > 0 ? `+${weightStats.weeklyChange.toFixed(1)}` : weightStats.weeklyChange.toFixed(1)} kg
              </span>
            </div>
            <div>
              <span className="text-[9px] text-slate-450 font-bold uppercase tracking-widest block">Monthly</span>
              <span className={`font-outfit text-sm font-extrabold mt-0.5 block ${
                weightStats.monthlyChange < 0 ? "text-brand-green" : weightStats.monthlyChange > 0 ? "text-rose-500" : "text-slate-500"
              }`}>
                {weightStats.monthlyChange > 0 ? `+${weightStats.monthlyChange.toFixed(1)}` : weightStats.monthlyChange.toFixed(1)} kg
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center border-t border-white/5 pt-3">
            No weight entries logged yet. Click Log Weight to start!
          </p>
        )}
      </div>

      {/* Current Streak Widget */}
      <div 
        onClick={handleQuickLog}
        className="glass-panel rounded-[28px] p-5 flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-transform group"
      >
        <div className="flex items-center gap-3">
          <span className="bg-brand-coral/10 text-brand-coral p-2.5 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-brand-coral/20">
            <Flame className="w-5 h-5 fill-current" />
          </span>
          <div>
            <h4 className="font-outfit text-sm font-bold text-white">Current Streak</h4>
            <p className="text-xs text-slate-400 mt-0.5">Consecutive active calorie logs</p>
          </div>
        </div>
        <div className="font-outfit text-2xl font-black text-brand-coral">
          <AnimatedCounter value={streak} /> <span className="text-xs font-semibold text-slate-455">days</span>
        </div>
      </div>

      {/* Recent Meals */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-outfit text-xs font-bold text-slate-405 uppercase tracking-widest pl-1">Recent Meals logged</h3>
          <Link href="/diary" className="text-[10px] font-bold text-brand-green uppercase tracking-widest flex items-center gap-1 hover:underline">
            View Diary <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentMeals.length === 0 ? (
            <div className="text-center py-6 glass-panel rounded-3xl p-6">
              <p className="text-xs text-slate-400">No meals logged for today yet.</p>
            </div>
          ) : (
            recentMeals.slice(0, 3).map((meal) => (
              <div 
                key={meal.id}
                className="glass-panel glass-panel-hover rounded-3xl p-3 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/5">
                    <Image 
                      src={meal.image} 
                      alt={meal.name} 
                      fill 
                      sizes="(max-width: 768px) 56px, 56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-outfit text-xs font-bold truncate text-white">
                      {meal.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-350 font-bold uppercase tracking-wider">
                      <span>{meal.category}</span>
                      <span>•</span>
                      <span className="text-brand-green">{meal.calories} kcal</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-slate-455 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-brand-green" /> {meal.time}
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] font-semibold text-slate-400 shrink-0">
                  {meal.macros}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Weight Modal */}
      <WeightModal
        show={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        newWeight={newWeight}
        setNewWeight={setNewWeight}
        loggingWeight={loggingWeight}
        onSubmit={handleLogWeight}
      />

      {/* AI Diet Analysis Modal */}
      <AnalysisModal
        show={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        loading={loadingAnalysis}
        data={analysisData}
      />

      {/* AI Tomorrow's Meal Plan Modal */}
      <PlanModal
        show={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        loading={loadingPlan}
        data={planData}
      />
    </div>
  );
}

