"use client";

import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  CartesianGrid 
} from "recharts";

interface WeeklyMacroChartProps {
  selectedMetric: "calories" | "protein" | "carbs" | "fat";
  weeklyLogs: any[];
  activeConfig: {
    color: string;
    gradientId: string;
  };
}

export default function WeeklyMacroChart({
  selectedMetric,
  weeklyLogs,
  activeConfig
}: WeeklyMacroChartProps) {
  return (
    <div className="h-64 w-full text-[10px] font-semibold" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        {selectedMetric === "calories" ? (
          <BarChart data={weeklyLogs} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.06)" />
            <XAxis dataKey="day" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(16, 185, 129, 0.03)' }} contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#0B1329', color: '#FFF' }} />
            <Bar dataKey="calories" fill="url(#colorCalories)" radius={[10, 10, 0, 0]} />
          </BarChart>
        ) : (
          <AreaChart data={weeklyLogs} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id={activeConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeConfig.color} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={activeConfig.color} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.06)" />
            <XAxis dataKey="day" stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: '1px solid #E2E8F0', backgroundColor: '#0B1329', color: '#FFF' }} />
            <Area type="monotone" dataKey={selectedMetric} stroke={activeConfig.color} strokeWidth={2.5} fill={`url(#${activeConfig.gradientId})`} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
