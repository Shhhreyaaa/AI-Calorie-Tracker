"use client";

import React from "react";
import { Scale, X, Loader2 } from "lucide-react";

interface WeightModalProps {
  show: boolean;
  onClose: () => void;
  newWeight: string;
  setNewWeight: (val: string) => void;
  loggingWeight: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function WeightModal({
  show,
  onClose,
  newWeight,
  setNewWeight,
  loggingWeight,
  onSubmit
}: WeightModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-panel border-white/10 rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-fade-in space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-outfit text-lg font-bold flex items-center gap-1.5 text-white">
            <Scale className="w-5 h-5 text-brand-sky" /> Log Weight Entry
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer text-slate-405"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Weight (kg)</label>
            <input 
              type="number" 
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="e.g. 78.5"
              required
              disabled={loggingWeight}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm outline-none text-white placeholder-slate-500"
            />
          </div>
          <button 
            type="submit"
            disabled={loggingWeight}
            className="w-full bg-brand-sky hover:bg-sky-600 disabled:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-glow flex items-center justify-center gap-1 cursor-pointer"
          >
            {loggingWeight ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Weight Log"}
          </button>
        </form>
      </div>
    </div>
  );
}
