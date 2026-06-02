"use client";

import React from "react";
import { Brain, X, Loader2, TrendingUp, Activity, ListTodo } from "lucide-react";

interface AnalysisModalProps {
  show: boolean;
  onClose: () => void;
  loading: boolean;
  data: any;
}

export default function AnalysisModal({
  show,
  onClose,
  loading,
  data
}: AnalysisModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel border-white/10 rounded-[32px] p-6 w-full max-w-lg shadow-2xl animate-fade-in space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="font-outfit text-lg font-bold flex items-center gap-1.5 text-white">
            <Brain className="w-5 h-5 text-brand-green animate-pulse" /> AI Daily Diet Analyzer
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-slate-405"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Analyzing daily macros...</span>
          </div>
        ) : data ? (
          <div className="space-y-5 text-xs">
            
            {/* Calorie & Macro Assessments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-emerald-500/5 p-3.5 rounded-2xl border border-brand-green/20">
                <h4 className="font-outfit font-bold text-brand-green mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> Calorie Assessment
                </h4>
                <p className="text-slate-305 leading-relaxed">{data.calorieAssessment}</p>
              </div>
              <div className="bg-sky-500/5 p-3.5 rounded-2xl border border-brand-sky/20">
                <h4 className="font-outfit font-bold text-brand-sky mb-1 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Macronutrient Assessment
                </h4>
                <p className="text-slate-305 leading-relaxed">{data.macroAssessment}</p>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-brand-green">Strengths</h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-400 pl-1">
                  {data.strengths.map((str: string, i: number) => (
                    <li key={i} className="leading-relaxed">{str}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-rose-450">Weaknesses</h4>
                <ul className="list-disc list-inside space-y-1.5 text-slate-405 pl-1">
                  {data.weaknesses.map((weak: string, i: number) => (
                    <li key={i} className="leading-relaxed">{weak}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Next Meal Recommendation */}
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-white/5 space-y-1">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Next Meal Recommendation</h4>
              <p className="text-slate-200 leading-relaxed font-semibold">{data.nextMealRecommendation}</p>
            </div>

            {/* Action Plan */}
            <div className="space-y-2 border-t border-white/5 pt-4">
              <h4 className="font-outfit font-bold text-slate-200 flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-brand-coral" /> Action Plan for Tomorrow
              </h4>
              <ul className="list-decimal list-inside space-y-1.5 text-slate-400 pl-1">
                {data.actionablePlan.map((act: string, i: number) => (
                  <li key={i} className="leading-relaxed">{act}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic text-center py-6">Could not load daily analysis data.</p>
        )}
      </div>
    </div>
  );
}
