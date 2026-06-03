"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Calendar, 
  Award, 
  ChevronDown, 
  Activity, 
  Sparkles,
  Download,
  Share2,
  Scale,
  Flame,
  TrendingUp,
  Plus,
  Loader2,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { calculateHealthScore } from "@/lib/utils/healthScore";
import { useApp } from "@/lib/context/AppContext";

// Dynamically import chart wrappers with loading skeletons for maximum load performance
const WeeklyMacroChart = dynamic(() => import("@/components/analytics/WeeklyMacroChart"), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full bg-slate-900/20 animate-pulse rounded-[24px] flex items-center justify-center text-xs text-slate-500">
      Loading Weekly Macro Chart...
    </div>
  )
});

const MacroRatioChart = dynamic(() => import("@/components/analytics/MacroRatioChart"), {
  ssr: false,
  loading: () => (
    <div className="w-36 h-36 bg-slate-900/20 animate-pulse rounded-full flex items-center justify-center text-xs text-slate-500">
      Loading...
    </div>
  )
});

const WeightTrendChart = dynamic(() => import("@/components/analytics/WeightTrendChart"), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full bg-slate-900/20 animate-pulse rounded-[24px] flex items-center justify-center text-xs text-slate-500">
      Loading Weight Trend Chart...
    </div>
  )
});

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const { 
    profile, 
    streak: streakData, 
    meals, 
    weightLogs, 
    loading: contextLoading, 
    refreshAll, 
    optimisticAddWeight 
  } = useApp();

  const [selectedMetric, setSelectedMetric] = useState<"calories" | "protein" | "carbs" | "fat">("calories");
  
  // Action States
  const [newWeight, setNewWeight] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportingPNG, setExportingPNG] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Derived user details from cached context
  const userName = useMemo(() => profile?.full_name || "Athlete", [profile]);

  const userGoals = useMemo(() => ({
    calories: profile?.daily_calorie_target ?? 2000,
    protein: profile?.protein_goal ?? 150,
    carbs: profile?.carbs_goal ?? 200,
    fat: profile?.fat_goal ?? 65
  }), [profile]);

  const streak = useMemo(() => streakData?.current_streak || 0, [streakData]);

  // Derive weekly logs chronologically in the user's local timezone
  const weeklyLogs = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const chartDataList = [];

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

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dateStr = getLocalDateStr(d);
      const dayName = days[d.getDay()];

      // Filter meals on this day
      const dayMeals = meals.filter(m => getLocalDateStr(new Date(m.logged_at)) === dateStr);
      const dayCalories = dayMeals.reduce((s, m) => s + m.calories, 0);
      const dayProtein = dayMeals.reduce((s, m) => s + m.protein, 0);
      const dayCarbs = dayMeals.reduce((s, m) => s + m.carbs, 0);
      const dayFat = dayMeals.reduce((s, m) => s + m.fat, 0);

      chartDataList.push({
        day: dayName,
        dateString: dateStr,
        calories: dayCalories,
        protein: dayProtein,
        carbs: dayCarbs,
        fat: dayFat,
        isLogged: dayMeals.length > 0
      });
    }

    return chartDataList;
  }, [meals]);

  // Compute Health Score from meals & user goals
  const healthScore = useMemo(() => {
    if (!profile) return 85;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const scoreBreakdown = calculateHealthScore(meals, userGoals, streak, tz);
      return scoreBreakdown.healthScore;
    } catch (err) {
      console.error("Failed to compute health score:", err);
      return 85;
    }
  }, [meals, userGoals, streak, profile]);

  // Weight Logging Handler
  const handleLogWeightSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWeight || isNaN(Number(newWeight))) {
      alert("Please enter a valid number for weight.");
      return;
    }

    const weightVal = Number(newWeight);

    try {
      setLoggingWeight(true);
      // 1. Optimistic Update
      optimisticAddWeight(weightVal);
      setNewWeight("");

      // 2. DB insert in background
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("weight_logs").insert({
        user_id: user.id,
        weight: weightVal,
        created_at: new Date().toISOString()
      });

      if (error) throw error;

      // Update current weight in users table for sync
      await supabase.from("users").update({
        current_weight: weightVal
      }).eq("id", user.id);

      await refreshAll();
    } catch (err: any) {
      alert(err.message || "Failed to save weight entry.");
    } finally {
      setLoggingWeight(false);
    }
  }, [newWeight, optimisticAddWeight, refreshAll]);

  // Weight Entry Deletion Handler
  const handleDeleteWeight = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this weight log?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("weight_logs").delete().eq("id", id);
      if (error) throw error;
      await refreshAll();
    } catch (err: any) {
      alert(err.message || "Failed to delete weight log.");
    }
  }, [refreshAll]);

  // PDF Export Trigger
  const handleExportPDF = useCallback(async () => {
    setExportingPDF(true);
    try {
      console.log("[PDF Export] Importing html2canvas-pro and jspdf dynamically...");
      const html2canvasModule = await import("html2canvas-pro");
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const jspdfModule = await import("jspdf");
      const jsPDF = jspdfModule.jsPDF || jspdfModule.default || jspdfModule;

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = 210;
      const pdfHeight = 297;
      const pages = ["pdf-page-1", "pdf-page-2", "pdf-page-3"];

      for (let i = 0; i < pages.length; i++) {
        const pageId = pages[i];
        const pageEl = document.getElementById(pageId);
        if (!pageEl) {
          throw new Error(`PDF report page element ${pageId} not found in DOM`);
        }

        const canvas = await html2canvas(pageEl, {
          scale: 2.0,
          useCORS: true,
          backgroundColor: "#0B1329",
          logging: false
        });

        const imgData = canvas.toDataURL("image/png");
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      }

      const fileName = `weekly-nutrition-report-${userName.toLowerCase().replace(/\s+/g, "-")}.pdf`;
      pdf.save(fileName);
      setToastMessage("Weekly report PDF exported successfully.");
    } catch (error: any) {
      console.error("PDF EXPORT ERROR:", error);
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setExportingPDF(false);
    }
  }, [userName]);

  // PNG Social Share Card Download
  const handleDownloadPNG = useCallback(async () => {
    setExportingPNG(true);
    console.log("PNG Export Clicked");
    try {
      console.log("[PNG Export] Importing html2canvas-pro dynamically...");
      const html2canvasModule = await import("html2canvas-pro");
      const html2canvas = html2canvasModule.default || html2canvasModule;
      console.log("[PNG Export] html2canvas resolved:", !!html2canvas);

      const cardEl = document.getElementById("progress-social-card");
      console.log("[PNG Export] cardEl:", cardEl);
      if (!cardEl) {
        throw new Error("Progress card element not found in DOM");
      }

      console.log("Generating Canvas");
      const canvas = await html2canvas(cardEl, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: true
      });
      console.log("PNG Created");

      console.log("[PNG Export] Triggering browser download link...");
      const link = document.createElement("a");
      link.download = "fitness-progress-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      console.log("Export Finished");
      setToastMessage("Progress card downloaded successfully.");
    } catch (error: any) {
      console.error("PNG EXPORT ERROR:", error);
      alert(error instanceof Error ? error.message : String(error));
    } finally {
      setExportingPNG(false);
    }
  }, []);

  // calculations
  const totalCal = weeklyLogs.reduce((s, d) => s + d.calories, 0);
  const totalProtein = weeklyLogs.reduce((s, d) => s + d.protein, 0);
  const totalCarbs = weeklyLogs.reduce((s, d) => s + d.carbs, 0);
  const totalFat = weeklyLogs.reduce((s, d) => s + d.fat, 0);

  const loggedDaysCount = weeklyLogs.filter(d => d.isLogged).length;
  const avgCal = loggedDaysCount > 0 ? Math.round(totalCal / loggedDaysCount) : 0;
  const avgProt = loggedDaysCount > 0 ? Math.round(totalProtein / loggedDaysCount) : 0;
  const avgCarb = loggedDaysCount > 0 ? Math.round(totalCarbs / loggedDaysCount) : 0;
  const avgFat = loggedDaysCount > 0 ? Math.round(totalFat / loggedDaysCount) : 0;

  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[0].weight) : null;
  const startWeight = weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight) : null;
  const weightChange = currentWeight !== null && startWeight !== null ? currentWeight - startWeight : 0;

  // Weight Prediction: average deficit = consumed - target
  const dailyTargetCalories = userGoals.calories;
  const loggedDays = weeklyLogs.filter(d => d.isLogged);
  const avgDailyDeficit = loggedDays.length > 0
    ? loggedDays.reduce((sum, d) => sum + (d.calories - dailyTargetCalories), 0) / loggedDays.length
    : 0;

  // predicted weight change in 30 days
  const predictedWeightChange = (avgDailyDeficit * 30) / 7700;
  const predictedWeight30Days = currentWeight !== null ? currentWeight + predictedWeightChange : null;

  // confidence assessment based on logging consistency (last 7 days)
  const confidenceLevel = loggedDaysCount >= 5 ? "High" : loggedDaysCount >= 3 ? "Medium" : "Low";

  // Average macros calculation for PieChart
  const avgMacros = useMemo(() => [
    { name: "Protein", value: avgProt || 130, color: "#10B981" },
    { name: "Carbohydrates", value: avgCarb || 192, color: "#0EA5E9" },
    { name: "Fat", value: avgFat || 59, color: "#F43F5E" }
  ], [avgProt, avgCarb, avgFat]);
  const totalMacroGram = useMemo(() => avgMacros.reduce((s, m) => s + m.value, 0), [avgMacros]);

  const loading = contextLoading;

  if (!mounted || (loading && meals.length === 0)) {
    return (
      <div className="space-y-6 pb-20 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-slate-800 rounded" />
            <div className="h-6 w-40 bg-slate-800 rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-slate-800 rounded-xl" />
            <div className="h-8 w-16 bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* 4 Stats Grid Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-panel rounded-2xl p-4 h-24 bg-slate-900/20 border-white/5 flex flex-col justify-between" />
          ))}
        </div>

        {/* Weekly Chart Skeleton */}
        <div className="glass-panel rounded-[32px] p-6 h-72 bg-slate-900/10 border-white/5 flex flex-col justify-between" />

        {/* Two Columns Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-[32px] p-6 h-60 bg-slate-900/10 border-white/5 md:col-span-1" />
          <div className="glass-panel rounded-[32px] p-6 h-60 bg-slate-900/10 border-white/5 md:col-span-2" />
        </div>
      </div>
    );
  }

  // Metric configs
  const metricConfigs = {
    calories: {
      label: "Calories",
      unit: "kcal",
      color: "#10B981",
      gradientId: "colorCalories",
      average: `${avgCal} kcal`
    },
    protein: {
      label: "Protein",
      unit: "g",
      color: "#10B981",
      gradientId: "colorProtein",
      average: `${avgProt}g`
    },
    carbs: {
      label: "Carbohydrates",
      unit: "g",
      color: "#0EA5E9",
      gradientId: "colorCarbs",
      average: `${avgCarb}g`
    },
    fat: {
      label: "Fat",
      unit: "g",
      color: "#F43F5E",
      gradientId: "colorFat",
      average: `${avgFat}g`
    }
  };

  const activeConfig = metricConfigs[selectedMetric];
  const consistencyRate = Math.round((loggedDaysCount / 7) * 100);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nutrition Trends</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Weekly Analytics</h2>
        </div>
        <button
          onClick={handleExportPDF}
          disabled={exportingPDF}
          className="flex items-center gap-1.5 bg-brand-green hover:bg-emerald-600 disabled:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-glow"
        >
          {exportingPDF ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          <span>{exportingPDF ? "Exporting PDF..." : "Export Weekly PDF"}</span>
        </button>
      </div>

      {/* Metric selection pills */}
      <div className="flex overflow-x-auto gap-2 bg-slate-205/40 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-100/50 dark:border-slate-800/30 scrollbar-none">
        {(Object.keys(metricConfigs) as Array<keyof typeof metricConfigs>).map((key) => (
          <button 
            key={key}
            onClick={() => setSelectedMetric(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedMetric === key 
                ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-350"
            }`}
          >
            {metricConfigs[key].label}
          </button>
        ))}
      </div>

      {/* Main Analytics Chart Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark space-y-4">
        
        {/* Metric Overview details */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-4">
          <div>
            <h3 className="font-outfit text-xs font-bold text-slate-400 uppercase tracking-wider">Average intake</h3>
            <div className="font-outfit text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-200 mt-1">
              {activeConfig.average} <span className="text-xs font-medium text-slate-400">/{activeConfig.unit}</span>
            </div>
          </div>
          <span className="text-xs bg-slate-50 dark:bg-slate-850 border border-slate-105 dark:border-slate-805 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-350">
            <Activity className="w-3.5 h-3.5 text-brand-green" /> {consistencyRate}% Consistent
          </span>
        </div>

        {/* Recharts Component */}
        <WeeklyMacroChart 
          selectedMetric={selectedMetric}
          weeklyLogs={weeklyLogs}
          activeConfig={activeConfig}
        />
      </div>

      {/* Secondary Chart: Macro Distribution Pie Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200 mb-4">
          <Sparkles className="w-4 h-4 text-brand-green" /> Total Macro Distribution Ratio
        </h3>

        <div className="flex items-center justify-between gap-4">
          <MacroRatioChart avgMacros={avgMacros} />

          <div className="flex-1 space-y-3.5 text-xs font-semibold">
            {avgMacros.map((macro, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: macro.color }} />
                  <span className="text-slate-650 dark:text-slate-300 font-medium">{macro.name}</span>
                </div>
                <span className="font-outfit font-extrabold text-slate-805 dark:text-slate-250">
                  {totalMacroGram > 0 ? Math.round((macro.value / totalMacroGram) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weight Tracker Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weight Log Manager & Trend Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
              <Scale className="w-4 h-4 text-brand-sky" /> Weight Logs & Progress
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical Trend</span>
          </div>

          {/* Weight Line Chart */}
          <WeightTrendChart weightLogs={weightLogs} />

          {/* Inline Log Weight Form */}
          <form onSubmit={handleLogWeightSubmit} className="flex gap-2">
            <input 
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Log today's weight (e.g. 78.5 kg)"
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl px-4 py-2 text-xs outline-none dark:text-white placeholder:text-slate-450 focus:border-brand-sky"
            />
            <button
              type="submit"
              disabled={loggingWeight}
              className="bg-brand-sky hover:bg-sky-600 disabled:bg-slate-800 text-white font-bold px-4 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              {loggingWeight ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span>Log</span>
            </button>
          </form>

          {/* Recent weight logs list */}
          {weightLogs.length > 0 && (
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Recent Entries</span>
              {weightLogs.slice().reverse().slice(0, 3).map((w) => (
                <div key={w.id} className="flex justify-between items-center text-xs bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-xl border border-slate-100/50 dark:border-slate-850">
                  <span className="text-slate-650 dark:text-slate-350 font-semibold">{new Date(w.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-outfit font-extrabold text-slate-805 dark:text-white">{w.weight} kg</span>
                    <button 
                      onClick={() => handleDeleteWeight(w.id)}
                      className="text-rose-500 hover:text-rose-600 font-bold cursor-pointer text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature 10: 30-Day Weight Prediction Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
                <TrendingUp className="w-4 h-4 text-brand-green" /> Weight Prediction Engine
              </h3>
              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                confidenceLevel === "High" 
                  ? "bg-brand-green/10 text-brand-green" 
                  : confidenceLevel === "Medium" 
                    ? "bg-amber-500/10 text-amber-500" 
                    : "bg-rose-500/10 text-rose-500"
              }`}>
                Confidence: {confidenceLevel}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Based on your logging habits and your 7-day average calorie deficit / surplus, here is your projected body mass change in 30 days:
            </p>

            {currentWeight !== null ? (
              <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2 mt-2">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">30-Day Forecast</div>
                <div className="font-outfit text-3xl font-extrabold tracking-tight text-slate-805 dark:text-slate-150">
                  {predictedWeight30Days?.toFixed(1)} <span className="text-xs font-semibold text-slate-450">kg</span>
                </div>
                <span className={`inline-block text-xs font-bold py-0.5 px-2 rounded-lg ${
                  predictedWeightChange < 0 ? "bg-brand-green/10 text-brand-green" : predictedWeightChange > 0 ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500"
                }`}>
                  {predictedWeightChange > 0 ? `+${predictedWeightChange.toFixed(1)}` : predictedWeightChange.toFixed(1)} kg projection
                </span>
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-405 italic">
                Log your body weight in the widget to initialize the prediction engine
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-400 leading-relaxed mt-4 flex items-start gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-brand-sky shrink-0 mt-0.5" />
            <span>Calculation formula matches the metabolic model where 7,700 kcal deficit translates to 1 kg fat reduction. High logging consistency produces more reliable forecasts.</span>
          </div>
        </div>
      </div>

      {/* Share Progress Social PNG Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark space-y-4">
        <div className="flex justify-between items-center border-b border-slate-105 dark:border-slate-850 pb-3">
          <div>
            <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
              <Share2 className="w-4 h-4 text-brand-coral" /> Social Progress Card
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Share your fitness metrics on socials</p>
          </div>
          <button
            onClick={handleDownloadPNG}
            disabled={exportingPNG}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs py-1.5 px-3 rounded-xl cursor-pointer transition-colors"
          >
            {exportingPNG ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{exportingPNG ? "Generating Card..." : "Download PNG"}</span>
          </button>
        </div>

        {/* SOCIAL CARD PREVIEW CONTAINER */}
        <div className="flex justify-center p-2 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850">
          <div 
            id="progress-social-card"
            className="w-[340px] bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#020617] border border-indigo-500/20 rounded-[28px] p-6 text-white space-y-5 shadow-2xl relative overflow-hidden shrink-0"
          >
            {/* Ambient gradients */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-green" />
                <span className="font-outfit font-black text-xs tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-450 to-brand-sky">
                  AI Nutrition Platform
                </span>
              </div>
              <span className="text-[8px] text-indigo-300/60 font-extrabold uppercase tracking-widest">Stats Card</span>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nutrition Score</span>
              <div className="flex items-baseline gap-2">
                <span className="font-outfit text-5xl font-black tracking-tight text-white">{healthScore}</span>
                <span className="text-sm font-bold text-brand-green uppercase">/ 100 🏆</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <span className="text-[8px] text-indigo-200 font-bold uppercase block">Active Streak</span>
                <span className="font-outfit text-base font-extrabold text-brand-coral flex items-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4 fill-current animate-pulse" /> {streak} Days
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <span className="text-[8px] text-indigo-200 font-bold uppercase block">Weight Trend</span>
                <span className="font-outfit text-xs font-extrabold text-brand-sky flex items-center gap-1 mt-0.5">
                  ⚖️ {currentWeight !== null ? `${currentWeight.toFixed(1)} kg (${weightChange <= 0 ? "" : "+"}${weightChange.toFixed(1)} kg)` : "N/A"}
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <span className="text-[8px] text-indigo-200 font-bold uppercase block">Protein Progress</span>
                <span className="font-outfit text-xs font-extrabold text-brand-green flex items-center gap-1 mt-0.5">
                  🥩 {avgProt}g / {userGoals.protein}g
                </span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm">
                <span className="text-[8px] text-indigo-200 font-bold uppercase block">Consistency</span>
                <span className="font-outfit text-sm font-extrabold text-slate-200 mt-0.5">
                  📊 {consistencyRate}% Tracked
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-350 italic text-center border-t border-white/5 pt-3 leading-relaxed">
              "Consistency is the key to unlocking your genetic potential."
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Print Container for PDF Export (Rendered offscreen for clean layout rendering) */}
      {/* Hidden Print Container for PDF Export (Rendered offscreen for clean layout rendering) */}
      <div 
        id="analytics-print-report" 
        style={{ position: "fixed", left: "-9999px", top: 0, width: "794px", zIndex: -50 }} 
        className="text-white space-y-0"
      >
        {/* PAGE 1: COVER PAGE */}
        <div id="pdf-page-1" style={{ width: "794px", height: "1123px", padding: "80px 60px", boxSizing: "border-box" }} className="bg-[#0B1329] flex flex-col justify-between relative overflow-hidden">
          {/* Neon Glow Accents */}
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-sky/10 rounded-full blur-3xl" />
          
          <div className="space-y-12">
            {/* Branding Header */}
            <div className="flex items-center gap-2 border-b border-white/10 pb-6">
              <span className="w-3 h-3 rounded-full bg-brand-green shadow-[0_0_10px_#10B981]" />
              <span className="font-outfit font-black text-xs tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-emerald-450 to-brand-sky">
                AI CALORIE TRACKER PREMIUM
              </span>
            </div>

            {/* Main Cover Title */}
            <div className="space-y-4 pt-16">
              <span className="text-[10px] text-brand-green font-bold uppercase tracking-widest bg-brand-green/10 px-3 py-1 rounded-full w-fit block">
                Executive Dossier
              </span>
              <h1 className="font-outfit text-4xl font-black tracking-tight leading-tight text-white uppercase">
                Weekly Health &<br />Nutrition Audit
              </h1>
              <div className="w-20 h-1.5 bg-gradient-to-r from-brand-green to-brand-sky rounded-full" />
            </div>

            {/* Metadata Card */}
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 space-y-4 backdrop-blur-md max-w-md">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Prepared For</span>
                <span className="font-outfit text-xl font-bold text-slate-100">{userName}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Report Date</span>
                  <span className="text-xs font-bold text-slate-200">{new Date().toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider block">Dossier Period</span>
                  <span className="text-xs font-bold text-slate-200">Last 7 Days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cover Footer / Executive Presentation */}
          <div className="space-y-6">
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              This comprehensive health dossier evaluates your caloric consistency, macronutrient partitions, body composition velocity, and daily tracking behaviors over the past week. Included are precise forecast modeling, nutritional efficiency breakdowns, and custom AI coach integrations designed to optimize your recovery and metabolic performance.
            </p>
            <div className="text-[9px] text-slate-500 font-medium uppercase tracking-widest border-t border-white/5 pt-4">
              Confidential Document &bull; Personal Fitness Analytics
            </div>
          </div>
        </div>

        {/* PAGE 2: GOALS & PROGRESS */}
        <div id="pdf-page-2" style={{ width: "794px", height: "1123px", padding: "80px 60px", boxSizing: "border-box" }} className="bg-[#0B1329] flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Section 01</span>
              <span className="font-outfit text-xs font-bold text-slate-400">METABOLIC PROFILE & WEIGHT VELOCITY</span>
            </div>

            {/* Biometric Profiles Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#111A35]/60 border border-white/5 rounded-2xl p-4">
                <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Current Weight</span>
                <span className="font-outfit text-lg font-black text-white mt-1 block">
                  {currentWeight ? `${currentWeight} kg` : "N/A"}
                </span>
              </div>
              <div className="bg-[#111A35]/60 border border-white/5 rounded-2xl p-4">
                <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Weight Change</span>
                <span className={`font-outfit text-lg font-black mt-1 block ${weightChange < 0 ? "text-brand-green" : "text-rose-500"}`}>
                  {weightChange <= 0 ? "" : "+"}{weightChange.toFixed(1)} kg
                </span>
              </div>
              <div className="bg-[#111A35]/60 border border-white/5 rounded-2xl p-4">
                <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Target Weight</span>
                <span className="font-outfit text-lg font-black text-white mt-1 block">
                  {profile?.target_weight ? `${profile.target_weight} kg` : "N/A"}
                </span>
              </div>
              <div className="bg-[#111A35]/60 border border-white/5 rounded-2xl p-4">
                <span className="text-[8px] text-slate-450 uppercase font-bold tracking-wider block">Activity Level</span>
                <span className="font-outfit text-xs font-black text-brand-sky mt-1.5 block uppercase truncate">
                  {profile?.activity_level || "Active"}
                </span>
              </div>
            </div>

            {/* SVG Weight Chart Area */}
            <div className="bg-[#111A35]/40 border border-white/5 rounded-3xl p-5 space-y-4">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Body Weight Trend (7-Day Log)</span>
              
              {weightLogs && weightLogs.length > 1 ? (() => {
                const weightLogsForChart = weightLogs.slice().reverse().slice(-7);
                const weights = weightLogsForChart.map(wl => Number(wl.weight));
                const minW = Math.min(...weights) - 1;
                const maxW = Math.max(...weights) + 1;
                const range = maxW - minW || 1;
                const points = weightLogsForChart.map((wl, idx) => {
                  const x = 40 + (idx / (weightLogsForChart.length - 1 || 1)) * 600;
                  const y = 160 - ((Number(wl.weight) - minW) / range) * 120;
                  return `${x},${y}`;
                }).join(" ");
                return (
                  <svg className="w-full h-44" viewBox="0 0 680 180">
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Grid lines */}
                    <line x1="40" y1="40" x2="640" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <line x1="40" y1="100" x2="640" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="3,3" />
                    <line x1="40" y1="160" x2="640" y2="160" stroke="rgba(255,255,255,0.1)" />
                    {/* Weight points fill */}
                    <polygon
                      points={`40,160 ${points} 640,160`}
                      fill="url(#weightGrad)"
                    />
                    {/* Weight line */}
                    <polyline
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="2.5"
                      points={points}
                    />
                    {/* Data dots */}
                    {weightLogsForChart.map((wl, idx) => {
                      const x = 40 + (idx / (weightLogsForChart.length - 1 || 1)) * 600;
                      const y = 160 - ((Number(wl.weight) - minW) / range) * 120;
                      return (
                        <g key={idx}>
                          <circle cx={x} cy={y} r="4" fill="#0B1329" stroke="#0EA5E9" strokeWidth="2" />
                          <text x={x} y={y - 8} fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                            {Number(wl.weight).toFixed(1)}
                          </text>
                          <text x={x} y="174" fill="#64748b" fontSize="8" textAnchor="middle">
                            {new Date(wl.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                );
              })() : (
                <div className="h-44 flex items-center justify-center border border-dashed border-white/5 rounded-2xl text-xs text-slate-500 italic">
                  Not enough weight data logged to display graph.
                </div>
              )}
            </div>

            {/* Prediction Model Box */}
            <div className="bg-[#111A35]/60 border border-white/5 rounded-[24px] p-6 space-y-4">
              <span className="text-[10px] text-brand-green font-bold uppercase tracking-widest block">Metabolic Prediction Forecast</span>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-[8px] text-slate-450 uppercase font-bold block">30-Day Estimated Weight</span>
                  <span className="font-outfit text-3xl font-black text-white">
                    {predictedWeight30Days ? `${predictedWeight30Days.toFixed(1)} kg` : "N/A"}
                  </span>
                  <span className={`inline-block text-[10px] font-bold py-0.5 px-2 rounded ${
                    predictedWeightChange < 0 ? "bg-brand-green/10 text-brand-green" : predictedWeightChange > 0 ? "bg-rose-500/10 text-rose-500" : "bg-slate-500/10 text-slate-500"
                  }`}>
                    {predictedWeightChange > 0 ? `+${predictedWeightChange.toFixed(1)}` : predictedWeightChange.toFixed(1)} kg predicted change
                  </span>
                </div>
                <div className="text-xs text-slate-400 leading-relaxed flex items-center">
                  Predictive calculations match the thermodynamic metabolic model, where an cumulative 7,700 kcal deficit translates to 1 kg fat reduction. Forecast is calibrated at "{confidenceLevel}" confidence based on tracking frequency.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-white/5 pt-4">
            <span>AI CALORIE TRACKER &bull; METABOLIC FORECASTS</span>
            <span>PAGE 2</span>
          </div>
        </div>

        {/* PAGE 3: NUTRITION & INSIGHTS */}
        <div id="pdf-page-3" style={{ width: "794px", height: "1123px", padding: "80px 60px", boxSizing: "border-box" }} className="bg-[#0B1329] flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Section 02</span>
              <span className="font-outfit text-xs font-bold text-slate-400">MACRONUTRIENT AUDIT & AI INSIGHTS</span>
            </div>

            {/* Nutrients average vs target */}
            <div className="bg-[#111A35]/60 border border-white/5 rounded-3xl p-5 space-y-4">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Macro Targets & Weekly Averages</span>
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/10 text-slate-450 pb-2">
                    <th className="pb-2">Nutrient</th>
                    <th className="pb-2">Average Consumed</th>
                    <th className="pb-2">Daily Goal Target</th>
                    <th className="pb-2">Percentage Met</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="py-3 font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-green" /> Calories</td>
                    <td className="py-3 font-bold text-brand-green">{avgCal} kcal</td>
                    <td className="py-3 text-slate-350">{userGoals.calories} kcal</td>
                    <td className="py-3 font-black">{userGoals.calories > 0 ? Math.round((avgCal / userGoals.calories) * 100) : 0}%</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-green" /> Protein</td>
                    <td className="py-3 font-bold text-slate-200">{avgProt}g</td>
                    <td className="py-3 text-slate-350">{userGoals.protein}g</td>
                    <td className="py-3 font-black">{userGoals.protein > 0 ? Math.round((avgProt / userGoals.protein) * 100) : 0}%</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-sky" /> Carbohydrates</td>
                    <td className="py-3 font-bold text-slate-200">{avgCarb}g</td>
                    <td className="py-3 text-slate-350">{userGoals.carbs}g</td>
                    <td className="py-3 font-black">{userGoals.carbs > 0 ? Math.round((avgCarb / userGoals.carbs) * 100) : 0}%</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 font-semibold flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F43F5E]" /> Fat</td>
                    <td className="py-3 font-bold text-slate-200">{avgFat}g</td>
                    <td className="py-3 text-slate-350">{userGoals.fat}g</td>
                    <td className="py-3 font-black">{userGoals.fat > 0 ? Math.round((avgFat / userGoals.fat) * 100) : 0}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Macro Distribution visual bar */}
            <div className="bg-[#111A35]/40 border border-white/5 rounded-2xl p-5 space-y-3">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Nutritional Ratio Distribution</span>
              
              {/* Stacked Horizontal Bar */}
              <div className="w-full h-6 rounded-lg bg-slate-900 overflow-hidden flex">
                <div style={{ width: `${totalMacroGram > 0 ? (avgProt / totalMacroGram) * 100 : 33}%` }} className="bg-brand-green h-full" title="Protein" />
                <div style={{ width: `${totalMacroGram > 0 ? (avgCarb / totalMacroGram) * 100 : 33}%` }} className="bg-brand-sky h-full" title="Carbs" />
                <div style={{ width: `${totalMacroGram > 0 ? (avgFat / totalMacroGram) * 100 : 34}%` }} className="bg-[#F43F5E] h-full" title="Fat" />
              </div>
              
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-brand-green">Protein: {totalMacroGram > 0 ? Math.round((avgProt / totalMacroGram) * 100) : 33}%</span>
                <span className="text-brand-sky">Carbs: {totalMacroGram > 0 ? Math.round((avgCarb / totalMacroGram) * 100) : 33}%</span>
                <span className="text-[#F43F5E]">Fat: {totalMacroGram > 0 ? Math.round((avgFat / totalMacroGram) * 100) : 34}%</span>
              </div>
            </div>

            {/* AI Coach Insights block */}
            <div className="bg-[#111A35]/60 border border-brand-green/20 rounded-[24px] p-6 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-green/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-green" />
                <span className="text-[10px] text-brand-green font-bold uppercase tracking-widest">AI Coach Core Recommendations</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-semibold italic">
                {avgProt < userGoals.protein 
                  ? `"Your weekly protein average is exactly ${userGoals.protein - avgProt}g short of your daily goal. I strongly advise supplementing your dinner menu with clean protein sources (e.g. 150g chicken breast or 200g Greek yogurt) to preserve muscle mass during metabolic shifts. Your logging rate is ${consistencyRate}%, which is excellent. Keep logging daily to increase forecast accuracy."`
                  : `"Fantastic job! Your weekly protein average of ${avgProt}g successfully satisfies your daily target of ${userGoals.protein}g. Deficits calculated show consistent metabolic energy rates. Maintain this tracking rate of ${consistencyRate}% to lock in your streaks."`}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[8px] text-slate-500 border-t border-white/5 pt-4">
            <span>AI CALORIE TRACKER &bull; MACRONUTRIENT AUDITS</span>
            <span>PAGE 3</span>
          </div>
        </div>
      </div>

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-1.5 animate-fade-in border border-slate-800">
          <CheckCircle className="w-4 h-4 text-brand-green fill-current animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}
