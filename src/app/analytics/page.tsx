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
  Area 
} from "recharts";
import { Calendar, ChevronDown, Award, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [metric, setMetric] = useState<"calories" | "macros">("calories");

  useEffect(() => {
    setMounted(true);
  }, []);

  const weeklyData = [
    { day: "Mon", calories: 1850, protein: 120, carbs: 180, fat: 55 },
    { day: "Tue", calories: 2100, protein: 145, carbs: 210, fat: 68 },
    { day: "Wed", calories: 1950, protein: 130, carbs: 190, fat: 58 },
    { day: "Thu", calories: 2200, protein: 155, carbs: 220, fat: 65 },
    { day: "Fri", calories: 1750, protein: 110, carbs: 170, fat: 50 },
    { day: "Sat", calories: 2050, protein: 140, carbs: 200, fat: 62 },
    { day: "Sun", calories: 1980, protein: 135, carbs: 195, fat: 59 },
  ];

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div>
          <span className="text-[10px] text-slate-405 font-bold uppercase tracking-wider block">Nutrition Trends</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Weekly Reports</h2>
        </div>
        <div className="h-[250px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-center">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nutrition Trends</span>
          <h2 className="font-outfit text-2xl font-bold tracking-tight">Weekly Reports</h2>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800/85 p-1 rounded-xl">
          <button 
            onClick={() => setMetric("calories")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${metric === "calories" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            Calories
          </button>
          <button 
            onClick={() => setMetric("macros")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${metric === "macros" ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-white shadow-sm" : "text-slate-500"}`}
          >
            Macros
          </button>
        </div>
      </div>

      {/* Primary Chart Widget */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-outfit text-sm font-bold text-slate-800 dark:text-slate-200">
            {metric === "calories" ? "Calorie Intake History" : "Macros Ratio Distribution"}
          </h3>
          <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Past 7 Days
          </span>
        </div>

        <div className="h-60 w-full text-xs font-semibold">
          <ResponsiveContainer width="100%" height="100%">
            {metric === "calories" ? (
              <BarChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.04)' }} contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0' }} />
                <Bar dataKey="calories" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            ) : (
              <AreaChart data={weeklyData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0' }} />
                <Area type="monotone" dataKey="protein" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="carbs" stackId="1" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.15} />
                <Area type="monotone" dataKey="fat" stackId="1" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.15} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Aggregate metrics review */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-premium dark:shadow-premium-dark space-y-4">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-205">
          <Award className="w-4 h-4 text-brand-green" />
          Weekly Performance Insights
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-450 font-medium">Average Daily Calories</span>
            <span className="font-outfit font-bold text-slate-850 dark:text-slate-200">1,982 kcal / day</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-450 font-medium">Daily Target Adherence</span>
            <span className="font-outfit font-bold text-brand-green">94.2% consistent</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-450 font-medium">Top Macro Consumption</span>
            <span className="font-outfit font-bold text-brand-sky">Carbs (Avg 192g)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
