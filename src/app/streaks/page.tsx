"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Flame, 
  CheckCircle, 
  Award, 
  Sparkles, 
  Loader2, 
  Target, 
  Zap, 
  Scale,
  Droplet,
  Plus,
  Minus,
  Share2,
  Download,
  X
} from "lucide-react";
import { getAndUpdateActiveStreak } from "@/app/meals/actions";
import { createClient } from "@/lib/supabase/client";
import { AnimatePresence } from "framer-motion";

// Dynamic client-side import for html2canvas
let html2canvas: any = null;
if (typeof window !== "undefined") {
  html2canvas = require("html2canvas");
}

type GoalType = "Weight Loss" | "Lean Muscle Gain" | "Maintenance" | "Body Recomposition";

export default function StreaksPage() {
  const router = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [streakDays, setStreakDays] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [targetRate, setTargetRate] = useState(0);
  const [loggedDates, setLoggedDates] = useState<string[]>([]);
  const [weightLogsCount, setWeightLogsCount] = useState(0);
  const [hasLoggedWeightToday, setHasLoggedWeightToday] = useState(false);
  const [allMealsCount, setAllMealsCount] = useState(0);

  // Profile data
  const [fullName, setFullName] = useState("User");
  const [startingWeight, setStartingWeight] = useState(75);
  const [targetWeight, setTargetWeight] = useState(70);

  // Today's totals and goals states
  const [todayCalories, setTodayCalories] = useState(0);
  const [todayProtein, setTodayProtein] = useState(0);
  const [todayCarbs, setTodayCarbs] = useState(0);
  const [todayFat, setTodayFat] = useState(0);

  const [goalCalories, setGoalCalories] = useState(2000);
  const [goalProtein, setGoalProtein] = useState(150);
  const [goalCarbs, setGoalCarbs] = useState(200);
  const [goalFat, setGoalFat] = useState(65);

  // Water logs (glasses of 250ml)
  const [waterLogged, setWaterLogged] = useState(0);

  // Share Card states
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<"protein" | "streak" | "weight" | "macros">("protein");
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  const fetchStreakStats = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Load water log from localStorage
      const todayStr = new Date().toISOString().split("T")[0];
      const localWater = localStorage.getItem(`water_${user.id}_${todayStr}`);
      if (localWater) {
        setWaterLogged(Number(localWater));
      }

      // Fetch streak stats, weight logs, total meals, user profile, and today's meals in parallel
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [stats, weightRes, mealsAllRes, userRes, mealsTodayRes] = await Promise.all([
        getAndUpdateActiveStreak(tz).catch(err => {
          console.error("Streak calculation error:", err);
          return null;
        }),
        supabase.from("weight_logs").select("created_at, weight").eq("user_id", user.id),
        supabase.from("meals").select("id").eq("user_id", user.id),
        supabase.from("users").select("full_name, daily_calorie_target, protein_goal, carbs_goal, fat_goal, current_weight, target_weight").eq("id", user.id).maybeSingle(),
        supabase.from("meals").select("calories, protein, carbs, fat").eq("user_id", user.id).gte("logged_at", today.toISOString())
      ]);

      if (stats) {
        setStreakDays(stats.current_streak || 0);
        setLongestStreak(stats.longest_streak || 0);
        setTargetRate(stats.target_rate || 0);
        setLoggedDates((stats.unique_logged_days || []) as string[]);
      }

      const weightData = weightRes.data;
      setWeightLogsCount(weightData?.length || 0);

      // Check if logged weight today
      const hasWeightToday = weightData?.some(wl => {
        const logDate = new Date(wl.created_at).toISOString().split("T")[0];
        return logDate === todayStr;
      }) || false;
      setHasLoggedWeightToday(hasWeightToday);

      const mealsAll = mealsAllRes.data;
      setAllMealsCount(mealsAll?.length || 0);

      const userData = userRes.data;
      if (userData) {
        setGoalCalories(userData.daily_calorie_target ?? 2000);
        setGoalProtein(userData.protein_goal ?? 150);
        setGoalCarbs(userData.carbs_goal ?? 200);
        setGoalFat(userData.fat_goal ?? 65);
        setFullName(userData.full_name || "Athlete");
        setStartingWeight(userData.current_weight || 75);
        setTargetWeight(userData.target_weight || 70);
      } else {
        // Fallback check on legacy goals
        const { data: goalData } = await supabase
          .from("goals")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (goalData) {
          setGoalCalories(goalData.calories);
          setGoalProtein(goalData.protein);
          setGoalCarbs(goalData.carbs);
          setGoalFat(goalData.fat);
        }
      }

      const mealsData = mealsTodayRes.data;
      if (mealsData) {
        const sumCalories = mealsData.reduce((sum, m) => sum + m.calories, 0);
        const sumProtein = mealsData.reduce((sum, m) => sum + m.protein, 0);
        const sumCarbs = mealsData.reduce((sum, m) => sum + m.carbs, 0);
        const sumFat = mealsData.reduce((sum, m) => sum + m.fat, 0);

        setTodayCalories(sumCalories);
        setTodayProtein(sumProtein);
        setTodayCarbs(sumCarbs);
        setTodayFat(sumFat);
      }

    } catch (err) {
      console.error("Failed to load streak stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreakStats();
  }, []);

  const handleUpdateWater = (val: number) => {
    const newVal = Math.max(0, waterLogged + val);
    setWaterLogged(newVal);
    
    // Save to localStorage
    const todayStr = new Date().toISOString().split("T")[0];
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) {
        localStorage.setItem(`water_${user.id}_${todayStr}`, newVal.toString());
      }
    });
  };

  // Compute XP and Leveling
  const xp = (loggedDates.length * 50) + (streakDays * 100) + (weightLogsCount * 100) + (waterLogged * 10);
  const level = Math.floor(xp / 500) + 1;
  const xpInCurrentLevel = xp % 500;
  const levelProgressPercentage = (xpInCurrentLevel / 500) * 100;

  const getLevelName = (lvl: number) => {
    if (lvl === 1) return "Rookie";
    if (lvl === 2) return "Beginner";
    if (lvl === 3) return "Warrior";
    if (lvl === 4) return "Athlete";
    return "Elite";
  };
  const levelName = getLevelName(level);

  // Badge list definitions
  const achievements = [
    {
      name: "First Meal Logged",
      desc: "Log your first meal using AI Scanner or Search.",
      unlocked: allMealsCount > 0,
      emoji: "🏆",
      progress: Math.min(allMealsCount, 1),
      target: 1
    },
    {
      name: "7 Day Streak",
      desc: "Maintain a logging streak for 7 consecutive days.",
      unlocked: streakDays >= 7,
      emoji: "🔥",
      progress: Math.min(streakDays, 7),
      target: 7
    },
    {
      name: "Protein Master",
      desc: "Consume 100% of your daily protein target.",
      unlocked: todayProtein >= goalProtein && goalProtein > 0,
      emoji: "💪",
      progress: Math.min(todayProtein, goalProtein),
      target: goalProtein
    },
    {
      name: "Consistency King",
      desc: "Log meals on 5 unique dates.",
      unlocked: loggedDates.length >= 5,
      emoji: "⚡",
      progress: Math.min(loggedDates.length, 5),
      target: 5
    }
  ];

  // Daily Missions
  const dailyMissions = [
    {
      name: "Hit Protein Target",
      desc: `Log ${goalProtein}g of protein today.`,
      xp: 100,
      done: todayProtein >= goalProtein && goalProtein > 0,
      progress: `${todayProtein}/${goalProtein}g`
    },
    {
      name: "Stay Under Calories",
      desc: `Log food and stay below ${goalCalories} kcal.`,
      xp: 50,
      done: todayCalories > 0 && todayCalories <= goalCalories,
      progress: `${todayCalories}/${goalCalories} kcal`
    },
    {
      name: "Hydrate & Log Water",
      desc: "Drink 8 glasses of water (2.0L) today.",
      xp: 50,
      done: waterLogged >= 8,
      progress: `${waterLogged}/8 cups`
    },
    {
      name: "Log Daily Weight",
      desc: "Track your weight today in Transformation Center.",
      xp: 75,
      done: hasLoggedWeightToday,
      progress: hasLoggedWeightToday ? "Completed" : "Pending"
    }
  ];

  // Social Share Card download handler using html2canvas
  const downloadShareCard = async () => {
    if (!html2canvas || !cardRef.current || isGeneratingCard) return;
    setIsGeneratingCard(true);
    try {
      // Ensure element is visible during capture
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#020617",
        scale: 2,
        logging: false,
        useCORS: true
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `antigravity_badge_${activeShareTab}.png`;
      link.click();
    } catch (err) {
      console.error("Failed to generate card image:", err);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Calendar days helper
  const getCalendarDays = () => {
    const tz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      
      let dateStr = "";
      try {
        const parts = formatter.formatToParts(d);
        const year = parts.find(p => p.type === "year")?.value;
        const month = parts.find(p => p.type === "month")?.value;
        const day = parts.find(p => p.type === "day")?.value;
        dateStr = `${year}-${month}-${day}`;
      } catch (e) {
        dateStr = d.toISOString().split("T")[0];
      }
      
      const logged = loggedDates.includes(dateStr);
      return { day: dayName, logged };
    });
  };
  const calendarDays = getCalendarDays();

  if (loading) {
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

        {/* Streak Stats Card Skeleton */}
        <div className="glass-panel rounded-[32px] p-6 h-56 bg-slate-900/20 border-white/5" />

        {/* Level & Target Stats Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel rounded-2xl p-5 h-28 bg-slate-900/10 border-white/5" />
          <div className="glass-panel rounded-2xl p-5 h-28 bg-slate-900/10 border-white/5" />
        </div>

        {/* Calendar Grid Skeleton */}
        <div className="glass-panel rounded-[32px] p-6 h-64 bg-slate-900/15 border-white/5" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-end">
        <div>
          <span className="text-[10px] text-[#00ff88] font-bold uppercase tracking-wider block font-sans">Achievements</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight text-white">Athlete Center</h2>
        </div>
        <button 
          onClick={() => setShowShareModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-[#8b5cf6]/25 to-[#00e5ff]/25 border border-[#8b5cf6]/35 text-xs text-white font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(139,92,246,0.15)]"
        >
          <Share2 className="w-4 h-4 text-[#00e5ff]" />
          Share Milestones
        </button>
      </div>

      {/* Gamified Level & XP Engine Card */}
      <div className="glass-panel border-[#8b5cf6]/20 bg-gradient-to-r from-slate-900/40 via-[#0f172a]/30 to-[#1e1b4b]/20 rounded-[32px] p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#8b5cf6]/10 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-4.5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#00e5ff] text-slate-950 flex flex-col items-center justify-center shadow-lg shrink-0 border border-white/10 relative overflow-hidden group">
            <span className="text-[9px] font-black uppercase tracking-wider block opacity-75 leading-none">Level</span>
            <span className="font-outfit text-2xl font-black mt-0.5 leading-none">{level}</span>
            <span className="absolute bottom-0 text-[8px] font-bold bg-slate-950/80 text-white w-full text-center py-0.5 leading-none uppercase">{levelName}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="font-outfit text-base font-extrabold text-white flex items-center gap-1.5">
                Experience Level: {levelName}
                <Sparkles className="w-3.5 h-3.5 text-[#00ff88]" />
              </h3>
              <span className="text-[10px] text-purple-400 font-bold">{xp} / {Math.ceil((xp + 500 - xpInCurrentLevel) / 500) * 500} XP</span>
            </div>
            
            {/* Level up progress bar */}
            <div className="w-full bg-slate-950/60 border border-white/5 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#8b5cf6] to-[#00e5ff] h-full rounded-full transition-all duration-700" 
                style={{ width: `${levelProgressPercentage}%` }}
              />
            </div>
            <span className="text-[9px] text-slate-400 block mt-1.5 font-semibold">
              Earn XP by scanning meals, logging weight daily, tracking hydration, and hitting missions. Next level in {500 - xpInCurrentLevel} XP.
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Main Streak Tracker & Daily Missions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Left Column: Streak Flame */}
        <div className="glass-panel border-white/5 rounded-[32px] p-6 sm:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden md:col-span-5">
          <div className="relative mb-5">
            <div className="absolute inset-0 bg-[#ff4d9d]/25 rounded-full blur-2xl scale-150 animate-pulse" />
            <div className="relative bg-[#ff4d9d]/10 p-5 rounded-[24px] border border-[#ff4d9d]/20 flex items-center justify-center">
              <Flame className="w-12 h-12 text-[#ff4d9d] fill-[#ff4d9d] animate-bounce" style={{ animationDuration: '3.5s' }} />
            </div>
          </div>
          <h3 className="font-outfit text-3xl font-black tracking-tight text-[#ff4d9d]">
            {streakDays} Days Logged
          </h3>
          <p className="text-[11px] text-slate-350 mt-1 max-w-[240px] leading-relaxed">
            {streakDays > 0 
              ? "Outstanding! Your streak multiplier is active. Keep scanning daily!" 
              : "No active logs today. Snap a photo of your plate to activate your streak!"}
          </p>

          {/* Calendar checkoff grid */}
          <div className="grid grid-cols-7 gap-2 w-full mt-6 border-t border-white/5 pt-5">
            {calendarDays.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[9px] text-slate-400 font-bold mb-1.5">{d.day}</span>
                <div 
                  className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center transition-all ${
                    d.logged 
                      ? "bg-[#00ff88] text-slate-950 shadow-[0_0_10px_rgba(0,255,136,0.3)] border border-[#00ff88]/20" 
                      : "bg-slate-950/40 border border-white/5 text-slate-500"
                  }`}
                >
                  {d.logged ? <CheckCircle className="w-4 h-4 text-slate-950" /> : <div className="w-1.5 h-1.5 bg-white/20 rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Daily Missions & Water Logging */}
        <div className="glass-panel border-white/5 rounded-[32px] p-6 md:col-span-7 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
              <Zap className="w-4.5 h-4.5 text-[#00e5ff]" /> Daily Missions
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Resets daily at midnight</span>
          </div>

          <div className="space-y-3">
            {dailyMissions.map((mission, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  mission.done 
                    ? "bg-[#00ff88]/5 border-[#00ff88]/20 text-white" 
                    : "bg-slate-950/30 border-white/5 text-slate-400"
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 w-4.5 h-4.5 rounded-md border flex items-center justify-center ${
                    mission.done 
                      ? "bg-[#00ff88] border-[#00ff88] text-slate-950" 
                      : "border-slate-700 bg-slate-950"
                  }`}>
                    {mission.done && <CheckCircle className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <h4 className={`text-xs font-bold ${mission.done ? "text-slate-100" : "text-slate-350"}`}>{mission.name}</h4>
                    <p className="text-[10px] text-slate-400 leading-snug">{mission.desc}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="text-[9px] font-bold block text-purple-400">+{mission.xp} XP</span>
                  <span className="text-[10px] font-bold text-slate-300 font-mono">{mission.progress}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Water Tracker Dashboard Module */}
          <div className="p-4 rounded-[24px] bg-[#00e5ff]/5 border border-[#00e5ff]/15 flex items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/20">
                <Droplet className={`w-5 h-5 text-[#00e5ff] ${waterLogged > 0 ? "fill-[#00e5ff] animate-pulse" : ""}`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Hydration Log</h4>
                <p className="text-[10px] text-slate-400">Track glasses of water logged today</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3.5">
              <button 
                onClick={() => handleUpdateWater(-1)}
                className="w-8 h-8 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:border-[#00e5ff]/40 transition-all active:scale-90"
              >
                <Minus className="w-4 h-4" />
              </button>
              <div className="text-center min-w-10">
                <span className="text-base font-black font-mono text-white block">{waterLogged * 250}</span>
                <span className="text-[8px] font-bold text-slate-400 block uppercase leading-none">ml</span>
              </div>
              <button 
                onClick={() => handleUpdateWater(1)}
                className="w-8 h-8 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-[#00e5ff] border-[#00e5ff]/20 hover:border-[#00e5ff]/45 hover:bg-[#00e5ff]/10 transition-all active:scale-90"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Statistics Rate Cards */}
      <div className="glass-panel border-white/5 rounded-[28px] p-5 grid grid-cols-2 gap-4 text-center">
        <div className="border-r border-white/5">
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Longest Run</span>
          <span className="font-outfit text-xl font-bold mt-1 text-white block">{longestStreak} days</span>
        </div>
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Adherence Rate</span>
          <span className="font-outfit text-xl font-bold mt-1 text-white block">
            {Math.round((targetRate || 0) * 100)}%
          </span>
        </div>
      </div>

      {/* Gamified Badges Card */}
      <div className="glass-panel border-white/5 rounded-[32px] p-6 space-y-4">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-white">
          <Award className="w-4.5 h-4.5 text-[#8b5cf6]" /> Unlocked Badges & Emojis
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach, index) => (
            <div 
              key={index}
              className={`p-3.5 rounded-2xl border flex items-center gap-3.5 transition-all duration-300 ${
                ach.unlocked 
                  ? "bg-slate-950/40 border-white/12 shadow-[0_0_15px_rgba(139,92,246,0.06)]" 
                  : "bg-slate-950/10 border-white/5 opacity-45"
              }`}
            >
              {/* Badge Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border text-lg ${
                ach.unlocked 
                  ? "bg-purple-500/10 border-purple-500/20 text-white" 
                  : "bg-slate-950 border-white/5 text-slate-650"
              }`}>
                {ach.emoji}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1">
                  {ach.name}
                  {ach.unlocked && <Sparkles className="w-3 h-3 text-[#00ff88] fill-[#00ff88]/20" />}
                </h4>
                <p className="text-[9px] text-slate-400 leading-snug">{ach.desc}</p>
                
                {/* Progress bar */}
                {!ach.unlocked && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-full bg-slate-950 border border-white/5 h-1 rounded-full overflow-hidden">
                      <div className="bg-brand-sky h-full rounded-full" style={{ width: `${(ach.progress / ach.target) * 100}%` }} />
                    </div>
                    <span className="text-[8px] font-bold text-slate-450 shrink-0">{ach.progress}/{ach.target}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram-style Social Share Modal Drawer */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            
            {/* Modal Container */}
            <div className="bg-slate-900 border border-white/10 rounded-[32px] max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-outfit text-base font-bold text-white">Export Share Card</h3>
                <button 
                  onClick={() => setShowShareModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 flex flex-col items-center">
                
                {/* Card Preview Area (Capture Target Node) */}
                <div 
                  ref={cardRef} 
                  id="instagram-share-card"
                  className="w-[340px] h-[340px] rounded-[24px] bg-slate-950 border-2 border-white/10 flex flex-col p-6 items-center justify-between text-center relative overflow-hidden shrink-0 shadow-lg"
                  style={{
                    backgroundImage: "radial-gradient(circle at top left, rgba(139,92,246,0.1), transparent), radial-gradient(circle at bottom right, rgba(0,229,255,0.08), transparent)"
                  }}
                >
                  {/* Subtle Glowing Corner Elements */}
                  <div className="absolute top-0 left-0 w-24 h-24 bg-[#8b5cf6]/5 rounded-full blur-xl" />
                  <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#00e5ff]/5 rounded-full blur-xl" />

                  {/* Top Branding */}
                  <div className="flex justify-between items-center w-full">
                    <span className="text-[8px] font-black tracking-widest text-[#00ff88] uppercase">ANTIGRAVITY FIT AI</span>
                    <span className="text-[8px] font-bold text-slate-400 font-mono">{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>

                  {/* Dynamic Content based on active Share Tab */}
                  {activeShareTab === "protein" && (
                    <div className="my-auto space-y-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-[#00ff88]/10 border border-[#00ff88]/20 mx-auto flex items-center justify-center">
                        <Award className="w-9 h-9 text-[#00ff88]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-[#00ff88] tracking-widest block">Achievement Lock</span>
                        <h4 className="font-outfit text-xl font-black text-white mt-1 uppercase tracking-tight">Protein Target Hit</h4>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                          {fullName} consumed {todayProtein}g of protein today, crushing their target threshold of {goalProtein}g!
                        </p>
                      </div>
                    </div>
                  )}

                  {activeShareTab === "streak" && (
                    <div className="my-auto space-y-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-[#ff4d9d]/10 border border-[#ff4d9d]/20 mx-auto flex items-center justify-center">
                        <Flame className="w-9 h-9 text-[#ff4d9d] fill-[#ff4d9d]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-[#ff4d9d] tracking-widest block">Consistency Run</span>
                        <h4 className="font-outfit text-xl font-black text-white mt-1 uppercase tracking-tight">{streakDays} Day Calorie Streak</h4>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                          Fueling consistency. Daily scan streak maintained on Antigravity health companion!
                        </p>
                      </div>
                    </div>
                  )}

                  {activeShareTab === "weight" && (
                    <div className="my-auto space-y-3.5">
                      <div className="w-16 h-16 rounded-2xl bg-[#00e5ff]/10 border border-[#00e5ff]/20 mx-auto flex items-center justify-center">
                        <Scale className="w-9 h-9 text-[#00e5ff]" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold uppercase text-[#00e5ff] tracking-widest block">Metabolic Progress</span>
                        <h4 className="font-outfit text-xl font-black text-white mt-1 uppercase tracking-tight">Weight Journey</h4>
                        <div className="flex justify-center gap-6 mt-2 text-left">
                          <div>
                            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">Logged weight</span>
                            <span className="text-sm font-black text-white font-mono">{startingWeight} kg</span>
                          </div>
                          <div className="border-l border-white/10 pl-4">
                            <span className="text-[8px] text-slate-400 font-bold block uppercase leading-none">Goal weight</span>
                            <span className="text-sm font-black text-[#00ff88] font-mono">{targetWeight} kg</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeShareTab === "macros" && (
                    <div className="my-auto space-y-3 w-full">
                      <span className="text-[9px] font-extrabold uppercase text-[#8b5cf6] tracking-widest block">Today's Macros</span>
                      <h4 className="font-outfit text-xl font-black text-white uppercase tracking-tight leading-none">Daily Fuel Breakdown</h4>
                      <span className="text-xs font-bold text-slate-300 block font-mono">{todayCalories} / {goalCalories} kcal</span>
                      
                      {/* Macro Percent Bar preview */}
                      <div className="space-y-1 max-w-[220px] mx-auto mt-2">
                        <div className="w-full h-3 rounded-full bg-slate-900 border border-white/5 flex overflow-hidden">
                          <div className="bg-[#ff4d9d] h-full" style={{ width: `${Math.max(10, (todayProtein * 4 / (todayCalories || 1)) * 100)}%` }} />
                          <div className="bg-[#00ff88] h-full" style={{ width: `${Math.max(10, (todayCarbs * 4 / (todayCalories || 1)) * 100)}%` }} />
                          <div className="bg-[#00e5ff] h-full" style={{ width: `${Math.max(10, (todayFat * 9 / (todayCalories || 1)) * 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-slate-450 font-mono mt-1">
                          <span className="text-[#ff4d9d]">P: {todayProtein}g</span>
                          <span className="text-[#00ff88]">C: {todayCarbs}g</span>
                          <span className="text-[#00e5ff]">F: {todayFat}g</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Card Bottom Level Banner */}
                  <div className="flex justify-between items-center w-full border-t border-white/5 pt-3.5 mt-2">
                    <div className="text-left">
                      <span className="text-[8px] font-black text-slate-450 uppercase block">Athlete</span>
                      <span className="text-[10px] font-black text-white">{fullName}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-bold text-purple-400 block uppercase leading-none">Level {level}</span>
                      <span className="text-[9px] font-black text-[#00e5ff] font-outfit uppercase">{levelName}</span>
                    </div>
                  </div>
                </div>

                {/* Tab Selectors */}
                <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950 border border-white/5 p-1 rounded-2xl">
                  {([
                    { id: "protein", label: "Protein" },
                    { id: "streak", label: "Streak" },
                    { id: "weight", label: "Weight" },
                    { id: "macros", label: "Macros" }
                  ] as const).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveShareTab(tab.id)}
                      className={`py-1.5 text-[10px] font-bold rounded-xl transition-all ${
                        activeShareTab === tab.id
                          ? "bg-slate-800 text-white shadow-md"
                          : "text-slate-450 hover:text-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Download Button */}
                <button
                  onClick={downloadShareCard}
                  disabled={isGeneratingCard}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-[#00ff88] to-[#00e5ff] text-slate-950 font-black text-xs hover:scale-[1.02] transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isGeneratingCard ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      Compiling Card Image...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-950" />
                      Save to Camera Roll / Downloads
                    </>
                  )}
                </button>

              </div>
            </div>
            
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
