"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Flame, 
  ChevronRight, 
  Calendar,
  TrendingUp,
  AlertCircle,
  Award,
  Heart,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Sparkles
} from "lucide-react";
import dynamic from "next/dynamic";
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

  const [showScoreDetails, setShowScoreDetails] = useState(false);

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

  // Compute health score
  const healthScoreInfo = useMemo(() => {
    if (!profile) return null;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return calculateHealthScore(meals, targets, streak, tz);
  }, [meals, targets, streak, profile]);

  // Level and XP computing
  const xpInfo = useMemo(() => {
    const totalXP = (uniqueLoggedDaysCount * 50) + (streak * 100) + (weightLogsCount * 100);
    const level = Math.floor(totalXP / 500) + 1;
    const progressPercent = (totalXP % 500) / 500 * 100;
    return { level, progressPercent };
  }, [uniqueLoggedDaysCount, streak, weightLogsCount]);

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

        {/* Calories Card Skeleton */}
        <div className="glass-panel rounded-[28px] p-5 h-44 flex flex-col justify-between bg-slate-900/10 border-white/5">
          <div className="h-3 w-16 bg-slate-800 rounded" />
          <div className="h-8 w-24 bg-slate-800 rounded" />
          <div className="h-2 bg-slate-800 rounded-full w-full" />
        </div>

        {/* Macro Rings Skeleton */}
        <div className="grid grid-cols-3 gap-3">
          <div className="h-36 bg-slate-900/40 border border-white/5 rounded-3xl" />
          <div className="h-36 bg-slate-900/40 border border-white/5 rounded-3xl" />
          <div className="h-36 bg-slate-900/40 border border-white/5 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 relative">
      
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
          
          <div className="flex flex-col gap-4 max-w-md">
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Streak count indicator */}
              <div className="bg-brand-coral/15 border border-brand-coral/30 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 shadow-sm">
                <Flame className="w-4 h-4 text-brand-coral fill-current animate-pulse" />
                <span className="font-outfit text-xs font-black text-brand-coral">
                  <AnimatedCounter value={streak} /> Day Streak
                </span>
              </div>

              {/* XP Level indicator */}
              <Link 
                href="/streaks" 
                className="bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 rounded-full px-3.5 py-1.5 flex items-center gap-2 hover:bg-[#8b5cf6]/25 transition-all shadow-sm group"
              >
                <span className="font-outfit text-xs font-black text-[#a78bfa] flex items-center gap-1">
                  🏆 Level {xpInfo.level}
                </span>
                <div className="w-16 bg-slate-900/80 h-2 rounded-full overflow-hidden shrink-0 border border-white/5 relative">
                  <div 
                    className="bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" 
                    style={{ width: `${xpInfo.progressPercent}%` }}
                  />
                </div>
              </Link>
            </div>
            
            {/* Protein Intake Progress */}
            <div className="glass-panel border-white/5 bg-slate-900/40 rounded-2xl p-3 flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Protein Progress</span>
                <span className="font-outfit text-xs font-extrabold text-brand-green">
                  <AnimatedCounter value={protein} /> / {targets.protein}g
                </span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-brand-green h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.35)]" 
                  style={{ width: `${Math.min((protein / targets.protein) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Health Score Dial */}
        {healthScoreInfo && (
          <div className="shrink-0 flex flex-col items-center justify-center p-5 bg-slate-950/60 rounded-3xl border border-white/5 backdrop-blur-md relative min-w-[140px]">
            <span className="text-[9px] text-slate-455 font-bold uppercase tracking-wider mb-2.5 block">Health Index</span>
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

      {/* Calories Progress Card */}
      <div className="glass-panel rounded-[28px] p-6 flex flex-col justify-between min-h-[140px] bg-gradient-to-br from-slate-900/30 to-slate-950/10 border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Daily Energy Target</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-outfit text-4xl font-extrabold tracking-tight text-white">
                <AnimatedCounter value={calories} />
              </span>
              <span className="text-sm font-medium text-slate-400">/ {targets.calories} kcal consumed</span>
            </div>
          </div>
          
          <div className="bg-brand-green/10 text-brand-green text-[11px] font-bold px-3 py-1.5 rounded-xl border border-brand-green/20 shrink-0">
            {remainingCalories > 0 ? (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand-green" />
                {remainingCalories} kcal remaining
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                Goal Exceeded by {calories - targets.calories} kcal
              </span>
            )}
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-900/60 border border-white/5 h-2.5 rounded-full overflow-hidden mt-5">
          <div 
            className="bg-gradient-to-r from-emerald-400 via-brand-green to-teal-500 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]" 
            style={{ width: `${caloriePercentage}%` }}
          />
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
            <Heart className={`w-7 h-7 mb-2 ${healthScoreInfo && healthScoreInfo.healthScore >= 80 ? "fill-current text-sky-400" : "text-slate-550"}`} />
            <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-200">Health Hero</span>
            <span className="text-[8px] text-slate-400 mt-1">{(healthScoreInfo && healthScoreInfo.healthScore >= 80) ? "Unlocked" : "80+ Health Score"}</span>
          </div>
        </div>
      </div>

      {/* Motivation Card */}
      <div className="glass-panel rounded-2xl p-4 bg-gradient-to-r from-slate-900/40 to-emerald-950/10 border-brand-green/10 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-brand-green shrink-0 mt-0.5 animate-pulse" />
        <div className="space-y-1">
          <span className="text-[9px] text-brand-green font-extrabold uppercase tracking-widest block">Daily Motivation</span>
          <p className="text-xs text-slate-350 italic leading-relaxed">
            {healthScoreInfo && healthScoreInfo.healthScore >= 80 
              ? "Outstanding performance! You are maintaining an elite health score. Keep this momentum and stay dedicated!"
              : "Every single nutrient and calorie tracked gets you closer to your fitness vision. Consistency builds results, let's win today!"}
          </p>
        </div>
      </div>

    </div>
  );
}

