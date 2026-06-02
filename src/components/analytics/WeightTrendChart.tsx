"use client";

import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

interface WeightTrendChartProps {
  weightLogs: any[];
}

export default function WeightTrendChart({ weightLogs }: WeightTrendChartProps) {
  const chartData = React.useMemo(() => {
    return weightLogs.map(w => ({
      date: new Date(w.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
      weight: Number(w.weight)
    }));
  }, [weightLogs]);

  if (weightLogs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-xs text-slate-400 font-semibold text-center p-4">No weight data available yet.</p>
      </div>
    );
  }

  if (weightLogs.length === 1) {
    return (
      <div className="h-full flex items-center justify-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
        <p className="text-[10px] text-slate-400 italic text-center p-4">Add 1 more weight log to render your trend chart</p>
      </div>
    );
  }

  return (
    <div className="h-44 w-full text-[10px] font-semibold" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.06)" />
          <XAxis dataKey="date" stroke="#94A3B8" fontSize={8} tickLine={false} axisLine={false} />
          <YAxis stroke="#94A3B8" fontSize={8} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#0B1329', color: '#FFF' }} />
          <Line type="monotone" dataKey="weight" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: "#0EA5E9", r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
