"use client";

import React, { useState } from "react";
import { Settings, Shield, Sliders, ToggleLeft, Key, Check } from "lucide-react";
import { logout } from "../auth/actions";

export default function SettingsPage() {
  const [calories, setCalories] = useState(2000);
  const [protein, setProtein] = useState(150);
  const [carbs, setCarbs] = useState(200);
  const [fat, setFat] = useState(65);

  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div>
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Preferences</span>
        <h2 className="font-outfit text-2xl font-bold tracking-tight">System Settings</h2>
      </div>

      {/* Daily Target Parameters Edit */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-205 mb-4">
          <Sliders className="w-4 h-4 text-brand-green" /> Daily Nutrition Targets
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Calorie Target (kcal)</label>
            <input 
              type="number" 
              value={calories}
              onChange={(e) => setCalories(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-4 py-3 text-sm outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Protein (g)</label>
              <input 
                type="number" 
                value={protein}
                onChange={(e) => setProtein(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-3 py-3 text-xs outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Carbs (g)</label>
              <input 
                type="number" 
                value={carbs}
                onChange={(e) => setCarbs(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-3 py-3 text-xs outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fat (g)</label>
              <input 
                type="number" 
                value={fat}
                onChange={(e) => setFat(Number(e.target.value))}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 focus:border-brand-green dark:focus:border-brand-green rounded-xl px-3 py-3 text-xs outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-brand-green hover:bg-emerald-600 text-white font-semibold text-xs py-3.5 px-4 rounded-xl shadow-glow active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" /> Changes Saved!
              </>
            ) : (
              "Save Daily Targets"
            )}
          </button>
        </form>
      </div>

      {/* Integration details card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 shadow-premium dark:shadow-premium-dark space-y-4">
        <h3 className="font-outfit text-sm font-bold flex items-center gap-1.5 text-slate-750 dark:text-slate-200">
          <Shield className="w-4 h-4 text-brand-sky" /> Integrations & API Config
        </h3>

        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-medium">Gemini AI Engine</span>
            </div>
            <span className="text-brand-green font-semibold">Active (Key Verified)</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-medium">Supabase Auth / DB</span>
            </div>
            <span className="text-brand-green font-semibold">Connected</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ToggleLeft className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-medium">Dark Mode Follows System</span>
            </div>
            <span className="text-slate-400 font-semibold">Enabled</span>
          </div>
        </div>
      </div>

      {/* Logout Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-5 shadow-premium dark:shadow-premium-dark flex items-center justify-between">
        <div>
          <h4 className="font-outfit text-sm font-bold text-slate-805 dark:text-slate-200">Account Session</h4>
          <p className="text-xs text-slate-405 mt-0.5">Securely sign out of your profile</p>
        </div>
        <form action={logout}>
          <button 
            type="submit"
            className="bg-brand-coral hover:bg-rose-600 text-white font-semibold text-xs py-2 px-4 rounded-xl active:scale-95 transition-all"
          >
            Log Out
          </button>
        </form>
      </div>

    </div>
  );
}
