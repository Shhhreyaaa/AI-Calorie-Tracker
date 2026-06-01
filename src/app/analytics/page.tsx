"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import { Calendar, Award, ChevronDown, Activity, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<"calories" | "protein" | "carbs" | "fat">("calories");
  
  // Weekly mock data (will fall back to database averages when populated)
  const weeklyData = [
    { day: "Mon", calories: 1850, protein: 120, carbs: 180, fat: 55 },
    { day: "Tue", calories: 2100, protein: 145, carbs: 210, fat: 68 },
    { day: "Wed", calories: 1950, protein: 130, carbs: 190, fat: 58 },
    { day: "Thu", calories: 2200, protein: 155, carbs: 220, fat: 65 },
    { day: "Fri", calories: 1750, protein: 110, carbs: 170, fat: 50 },
    { day: "Sat", calories: 2050, protein: 140, carbs: 200, fat: 62 },
    { day: "Sun", calories: 1980, protein: 135, carbs: 195, fat: 59 },
  ];

  // Average macros calculation for PieChart
  const avgMacros = [
    { name: "Protein", value: 130, color: "#10B981" },
    { name: "Carbohydrates", value: 192, color: "#0EA5E9" },
    { name: "Fat", value: 59, color: "#F43F5E" }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nutrition Trends</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Weekly Reports</h2>
        </div>
        <div className="h-[280px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] animate-pulse" />
      </div>
    );
  }

  // Get active configurations based on tab selection
  const metricConfigs = {
    calories: {
      label: "Calories",
      unit: "kcal",
      color: "#10B981",
      gradientId: "colorCalories",
      average: "1,982 kcal"
    },
    protein: {
      label: "Protein",
      unit: "g",
      color: "#10B981",
      gradientId: "colorProtein",
      average: "133g"
    },
    carbs: {
      label: "Carbohydrates",
      unit: "g",
      color: "#0EA5E9",
      gradientId: "colorCarbs",
      average: "192g"
    },
    fat: {
      label: "Fat",
      unit: "g",
      color: "#F43F5E",
      gradientId: "colorFat",
      average: "59g"
    }
  };

  const activeConfig = metricConfigs[selectedMetric];

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nutrition Trends</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Weekly Reports</h2>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>June 1, 2026</span>
        </div>
      </div>

      {/* Metric selection pills */}
      <div className="flex overflow-x-auto gap-2 bg-slate-205/40 dark:bg-slate-800/40 p-1 rounded-2xl border border-slate-100/50 dark:border-slate-800/30 scrollbar-none">
        {(Object.keys(metricConfigs) as Array<keyof typeof metricConfigs>).map((key) => (
          <button 
            key={key}
            onClick={() => setSelectedMetric(key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
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
          <span className="text-xs bg-slate-50 dark:bg-slate-850 border border-slate-100/60 dark:border-slate-800/65 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-brand-green" /> Target Met
          </span>
        </div>

        {/* Recharts Component */}
        <div className="h-64 w-full text-[10px] font-semibold">
          <ResponsiveContainer width="100%" height="100%">
            {selectedMetric === "calories" ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.06)" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.03)' }} contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', fontFamily: 'Inter' }} />
                <Bar dataKey="calories" fill="url(#colorCalories)" radius={[10, 10, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id={activeConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.06)" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', fontFamily: 'Inter' }} />
                <Area type="monotone" dataKey={selectedMetric} stroke={activeConfig.color} strokeWidth={2.5} fill={`url(#${activeConfig.gradientId})`} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Chart: Macro Distribution Pie Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200 mb-4">
          <Sparkles className="w-4 h-4 text-brand-green" /> Total Macro Distribution Ratio
        </h3>

        <div className="flex items-center justify-between gap-4">
          {/* Pie Chart */}
          <div className="w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={avgMacros}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={52}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {avgMacros.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Color Labels list */}
          <div className="flex-1 space-y-3.5 text-xs font-semibold">
            {avgMacros.map((macro, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: macro.color }} />
                  <span className="text-slate-650 dark:text-slate-300 font-medium">{macro.name}</span>
                </div>
                <span className="font-outfit font-extrabold text-slate-800 dark:text-slate-250">
                  {Math.round((macro.value / (130 + 192 + 59)) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Insights widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark space-y-4">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
          <Award className="w-4 h-4 text-brand-sky" /> Weekly Performance Insights
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-450 font-medium">Daily Target Consistency</span>
            <span className="font-outfit font-bold text-brand-green">94.2% consistent</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-450 font-medium">Protein Efficiency ratio</span>
            <span className="font-outfit font-bold text-slate-800 dark:text-slate-205">High (Avg 133g)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
