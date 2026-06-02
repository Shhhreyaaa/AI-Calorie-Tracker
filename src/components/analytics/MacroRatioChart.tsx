"use client";

import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MacroRatioChartProps {
  avgMacros: any[];
}

export default function MacroRatioChart({ avgMacros }: MacroRatioChartProps) {
  return (
    <div className="w-36 h-36 shrink-0" style={{ minWidth: 0 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
  );
}
